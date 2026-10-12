import type { WorkflowLogs } from '@/model/submit'
import {
  AdminApiError,
  type AdminApi,
  type AdminJobStatus,
  type Bucket,
  type BulkAction,
  type BulkItem,
  type BulkRequest,
  type Environment,
  type GroupBy,
  type Interval,
  type JobQuery,
  type JobRecord,
  type LiveWorkflow,
  type Percentiles,
  type StatsFilter,
  type WorkflowItem,
  type WorkflowPhase,
  type WorkflowQuery,
} from './admin-api'
import { createJobs, day, retentionDays, uuid, withRetention } from './admin-mock-data'
import { inputStats, runtimeStats } from './admin-mock-stats'
import { percentile, truncDate } from './format'

/*
 * A fake admin API for development and previews ("admin": { "mock": true } in
 * config.json). It generates a few hundred jobs over two years in the browser.
 * Only the admin session loads this module, and only in mock mode.
 */

function inFilter(job: JobRecord, filter: StatsFilter): boolean {
  if (filter.environment !== 'all' && job.environment !== filter.environment) return false
  if (filter.from && job.created_at < new Date(filter.from).toISOString()) return false
  if (filter.to && job.created_at >= new Date(filter.to).toISOString()) return false
  return true
}

function stats(values: (number | null | undefined)[]): Percentiles {
  const sorted = values.filter((v): v is number => v != null).sort((a, b) => a - b)
  return {
    avg: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null,
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p99: percentile(sorted, 0.99),
  }
}

const activeStatuses: AdminJobStatus[] = ['created', 'submitted', 'running']

function origins(jobs: JobRecord[]) {
  const counts = new Map<string | null, number>()
  for (const j of jobs) counts.set(j.origin ?? null, (counts.get(j.origin ?? null) ?? 0) + 1)
  return [...counts]
    .map(([origin, jobs_total]) => ({ origin, jobs_total }))
    .sort((a, b) => b.jobs_total - a.jobs_total)
}

function succeeded(job: JobRecord): boolean {
  return job.outcome === 'succeeded'
}

function phaseOf(status: AdminJobStatus): WorkflowPhase {
  switch (status) {
    case 'created':
    case 'submitted':
      return 'Pending'
    case 'running':
      return 'Running'
    case 'failed':
      return 'Failed'
    case 'error':
      return 'Error'
    default:
      return 'Succeeded'
  }
}

/**
 * Whether a bulk action applies to a workflow, like on the server.
 */
export function bulkApplicable(action: BulkAction, phase: string, suspended: boolean): boolean {
  switch (action) {
    case 'stop':
      return phase === 'Pending' || phase === 'Running'
    case 'retry':
      return phase === 'Failed' || phase === 'Error'
    case 'resume':
      return suspended
    case 'resubmit':
      return phase === 'Succeeded' || phase === 'Failed' || phase === 'Error'
    case 'delete':
      // a running workflow is stopped first, so a delete does not hit it by surprise
      return phase !== 'Pending' && phase !== 'Running'
  }
}

// the answers of the backend when the S3 data of a job is gone
const inputsDeleted = 'Input data was deleted after the retention period'
const logsDeleted = 'Logs were deleted after the retention period'
const inputsDeletedReason = 'Input data deleted after the retention period'
const stillRunningReason = 'Still running, stop it first'

const orphanNames = ['bakta-job-1.12.2-orphan', 'baktfold-job-0.3.0-orphan', 'bakta-job-1.11.0-old']

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 250))
}

class MockAdminApi implements AdminApi {
  #jobs = createJobs()
  // live Argo workflows: jobs of the last week that were not deleted or expired
  #workflows = new Set(
    this.#jobs
      .filter((j) => Date.now() - Date.parse(j.created_at) < 7 * day && j.workflow_name)
      .filter((j) => j.status !== 'deleted' && j.status !== 'expired')
      .map((j) => j.id),
  )

  // two running workflows wait at a suspend step
  #suspended = new Set(
    this.#jobs
      .filter((j) => this.#workflows.has(j.id) && j.status === 'running')
      .slice(0, 2)
      .map((j) => j.id),
  )

  #orphans = new Map<string, WorkflowItem>(
    orphanNames.map((name, i) => {
      // the old one finished before the retention period, so its data is gone
      const age = name.endsWith('-old') ? 40 : 3 + i * 5
      const finished = new Date(Date.now() - age * day).toISOString()
      const item: WorkflowItem = {
        name,
        job_id: null,
        workflow_kind: null,
        phase: i === 1 ? 'Failed' : 'Error',
        template: name.replace(/-(orphan|old)$/, ''),
        environment: 'production',
        started_at: finished,
        finished_at: finished,
        message: 'pod deleted',
        suspended: false,
      }
      return [name, item]
    }),
  )

  // the retention fields depend on the time, so they are set again on each access
  #find(id: string): JobRecord {
    const job = this.#jobs.find((j) => j.id === id)
    if (!job) throw new AdminApiError(404, 'job not found')
    return withRetention(job)
  }

  // whether the S3 data of a workflow still exists, also for workflows without a job
  #dataAvailable(w: WorkflowItem): boolean {
    if (w.job_id) return this.#find(w.job_id).data_available
    const reference = w.finished_at ?? w.started_at
    return !reference || Date.now() < Date.parse(reference) + retentionDays * day
  }

  #filtered(filter: StatsFilter) {
    return this.#jobs.filter((j) => inFilter(j, filter))
  }

  me() {
    return delay({ username: 'mock', name: 'Mock Admin', email: null, groups: ['bakta-admin'] })
  }

  summary(filter: StatsFilter) {
    const jobs = this.#filtered(filter)
    // finished jobs count by outcome, so expiry does not change the numbers
    const count = (o: JobRecord['outcome']) => jobs.filter((j) => j.outcome === o).length
    const finished = jobs.filter((j) => j.outcome).length
    const kinds = [...new Set(jobs.map((j) => j.workflow_kind))]
    return delay({
      jobs_total: jobs.length,
      jobs_finished: finished,
      jobs_succeeded: count('succeeded'),
      jobs_failed: count('failed'),
      jobs_error: count('error'),
      jobs_active: jobs.filter((j) => j.status === 'submitted' || j.status === 'running').length,
      success_rate: finished ? count('succeeded') / finished : null,
      runtime_seconds: stats(jobs.filter(succeeded).map((j) => j.runtime_seconds)),
      queue_seconds: stats(jobs.map((j) => j.queue_seconds)),
      total_input_bp: jobs.reduce((sum, j) => sum + (j.total_length ?? 0), 0),
      by_origin: origins(jobs),
      by_workflow_kind: kinds.map((kind) => {
        const ofKind = jobs.filter((j) => j.workflow_kind === kind)
        return {
          workflow_kind: kind,
          jobs_total: ofKind.length,
          jobs_finished: ofKind.filter((j) => j.outcome != null).length,
          jobs_succeeded: ofKind.filter(succeeded).length,
          jobs_failed: ofKind.filter((j) => j.outcome === 'failed').length,
          jobs_error: ofKind.filter((j) => j.outcome === 'error').length,
          runtime_seconds: stats(ofKind.filter(succeeded).map((j) => j.runtime_seconds)),
        }
      }),
    })
  }

  timeseries(filter: StatsFilter, interval: Interval, groupBy: GroupBy) {
    const groups = new Map<string, JobRecord[]>()
    for (const job of this.#filtered(filter)) {
      const start = truncDate(new Date(job.created_at), interval).toISOString()
      const group = groupBy === 'none' ? '' : String(job[groupBy])
      const key = `${start}|${group}`
      groups.set(key, [...(groups.get(key) ?? []), job])
    }
    const buckets: Bucket[] = [...groups.entries()].map(([key, jobs]) => {
      const [start, group] = key.split('|')
      const runtime = stats(jobs.filter(succeeded).map((j) => j.runtime_seconds))
      const input = stats(jobs.map((j) => j.total_length))
      return {
        period_start: start.replace('.000Z', 'Z'),
        group: groupBy === 'none' ? null : group,
        jobs_total: jobs.length,
        jobs_succeeded: jobs.filter(succeeded).length,
        jobs_failed: jobs.filter((j) => j.outcome === 'failed').length,
        jobs_error: jobs.filter((j) => j.outcome === 'error').length,
        runtime_p50: runtime.p50,
        runtime_p90: runtime.p90,
        runtime_avg: runtime.avg,
        total_input_bp: jobs.reduce((sum, j) => sum + (j.total_length ?? 0), 0),
        input_p50_bp: input.p50,
        input_avg_bp: input.avg,
      }
    })
    buckets.sort((a, b) => a.period_start.localeCompare(b.period_start))
    return delay({ interval, group_by: groupBy, buckets })
  }

  versions(filter: StatsFilter) {
    const items = new Map<string, JobRecord[]>()
    for (const job of this.#filtered(filter)) {
      const key = [job.bakta_version, job.bakta_db_version, job.baktfold_version].join('|')
      items.set(key, [...(items.get(key) ?? []), job])
    }
    return delay({
      items: [...items.values()].map((jobs) => ({
        bakta_version: jobs[0].bakta_version,
        bakta_db_version: jobs[0].bakta_db_version,
        baktfold_version: jobs[0].baktfold_version,
        jobs_total: jobs.length,
        first_seen: jobs[jobs.length - 1].created_at,
        last_seen: jobs[0].created_at,
      })),
    })
  }

  runtimes(filter: StatsFilter, workflowKind?: string) {
    const jobs = this.#filtered(filter).filter(
      (j) => !workflowKind || j.workflow_kind === workflowKind,
    )
    return delay(runtimeStats(jobs))
  }

  inputs(filter: StatsFilter, workflowKind?: string) {
    const jobs = this.#filtered(filter).filter(
      (j) => !workflowKind || j.workflow_kind === workflowKind,
    )
    return delay(inputStats(jobs))
  }

  jobs(query: JobQuery) {
    const q = query.q?.toLowerCase()
    const jobs = this.#filtered(query)
      .filter((j) => !query.status?.length || query.status.includes(j.status))
      .filter((j) => !query.workflowKind?.length || query.workflowKind.includes(j.workflow_kind))
      .filter(
        (j) =>
          !query.workflowPhase?.length ||
          (this.#workflows.has(j.id) && query.workflowPhase.includes(phaseOf(j.status))),
      )
      .filter(
        (j) =>
          !q ||
          j.id.startsWith(q) ||
          [j.genus, j.species, j.strain, j.name].some((t) => t?.toLowerCase().includes(q)),
      )
    const sort = query.sort ?? 'created_at'
    const field = sort.replace('-', '') as 'created_at' | 'runtime_seconds' | 'total_length'
    // "created_at" lists the newest first, the minus sign turns the order around
    const descending = sort.startsWith('-') === (field !== 'created_at')
    jobs.sort((a, b) => {
      const x = a[field] ?? -1
      const y = b[field] ?? -1
      return (x < y ? -1 : x > y ? 1 : 0) * (descending ? -1 : 1)
    })
    const offset = query.offset ?? 0
    return delay({
      total: jobs.length,
      items: jobs.slice(offset, offset + (query.limit ?? 50)).map((j) => ({
        ...withRetention(j),
        organism: [j.genus, j.species, j.strain].filter(Boolean).join(' ') || null,
        workflow_phase: this.#workflows.has(j.id) ? phaseOf(j.status) : null,
      })),
    })
  }

  async job(id: string) {
    const job = this.#find(id)
    return delay({ job, workflow: this.#workflows.has(id) ? this.#liveWorkflow(job) : null })
  }

  #liveWorkflow(job: JobRecord): LiveWorkflow {
    const phase = phaseOf(job.status)
    const steps = ['download', job.workflow_kind.replace('_', ' + '), 'upload']
    return {
      name: job.workflow_name ?? '',
      phase,
      started_at: job.started_at,
      finished_at: job.finished_at,
      message: job.error_message,
      suspended: this.#suspended.has(job.id),
      nodes: steps.map((step, i) => {
        const failedHere = (phase === 'Failed' || phase === 'Error') && i === 1
        const done = phase === 'Succeeded' || i === 0
        return {
          name: `${job.workflow_name}-${i}`,
          display_name: step,
          type: 'Pod',
          phase: failedHere ? phase : done ? 'Succeeded' : i === 1 ? phase : 'Pending',
          pod_name: `${job.workflow_name}-${step.replace(/\W+/g, '-')}-${1000 + i}`,
          started_at: job.started_at,
          finished_at: done || failedHere ? job.finished_at : null,
          message: failedHere ? job.error_message : null,
        }
      }),
    }
  }

  async jobLogs(id: string): Promise<WorkflowLogs> {
    const job = this.#find(id)
    // logs of a live workflow come from Argo, the others from the deleted archive
    if (!job.data_available && !this.#workflows.has(id)) throw new AdminApiError(410, logsDeleted)
    const failed = job.status === 'failed' || job.status === 'error'
    return delay({
      workflowKind: job.workflow_kind,
      stages: [
        { stage: 'download', status: 'succeeded', content: 'Downloading input files...\nDone.' },
        {
          stage: job.workflow_kind,
          status: failed ? 'failed' : job.status === 'running' ? 'running' : 'succeeded',
          content: `Bakta v${job.bakta_version ?? '-'}\nParse genome sequences...\n${
            failed ? 'ERROR: ' + job.error_message : 'Annotation finished.'
          }`,
        },
      ],
    })
  }

  async #setPhase(id: string, status: AdminJobStatus, newWorkflow: boolean) {
    const job = this.#find(id)
    if (newWorkflow) job.workflow_name = `${job.workflow_kind}-job-${uuid().slice(0, 8)}`
    // a new attempt has not finished yet
    if (status === 'running' || status === 'submitted') job.finished_at = null
    job.status = status
    job.outcome = status === 'failed' ? 'failed' : null
    job.updated_at = new Date().toISOString()
    this.#workflows.add(id)
    this.#suspended.delete(id)
    return delay({ workflow_name: job.workflow_name ?? '', phase: phaseOf(status) })
  }

  retry(id: string) {
    const job = this.#find(id)
    if (job.status !== 'failed' && job.status !== 'error') {
      return Promise.reject(new AdminApiError(409, 'workflow is not failed'))
    }
    if (!job.data_available) return Promise.reject(new AdminApiError(409, inputsDeleted))
    return this.#setPhase(id, 'running', false)
  }

  resubmit(id: string) {
    if (!this.#find(id).data_available) {
      return Promise.reject(new AdminApiError(409, inputsDeleted))
    }
    return this.#setPhase(id, 'submitted', true)
  }

  stop(id: string) {
    if (!activeStatuses.includes(this.#find(id).status)) {
      return Promise.reject(new AdminApiError(409, 'workflow is not running'))
    }
    return this.#setPhase(id, 'failed', false)
  }

  resume(id: string) {
    if (!this.#suspended.has(id)) {
      return Promise.reject(new AdminApiError(409, 'workflow is not suspended'))
    }
    this.#suspended.delete(id)
    return this.#setPhase(id, 'running', false)
  }

  deleteJob(id: string, purgeData: boolean) {
    const job = this.#find(id)
    const existed = this.#workflows.delete(id)
    job.status = 'deleted'
    // without data there is nothing to purge in S3
    const purged = purgeData && job.data_available ? 12 : 0
    return delay({ deleted_workflow: existed, purged_objects: purged })
  }

  #workflowItems(environment: Environment): WorkflowItem[] {
    const items: WorkflowItem[] = this.#jobs
      .filter((j) => this.#workflows.has(j.id))
      .map((j) => ({
        name: j.workflow_name ?? '',
        job_id: j.id,
        workflow_kind: j.workflow_kind,
        phase: phaseOf(j.status),
        template: `${j.workflow_kind.replace('_', '-')}-job-${j.bakta_version ?? '0.3.0'}`,
        environment: j.environment,
        started_at: j.started_at,
        finished_at: j.finished_at,
        message: j.error_message,
        suspended: this.#suspended.has(j.id),
      }))
    return [...items, ...this.#orphans.values()].filter(
      (w) => environment === 'all' || w.environment === environment,
    )
  }

  workflows(query: WorkflowQuery) {
    const phases = query.phases ?? []
    const items = this.#workflowItems(query.environment)
      .filter((w) => !query.orphans || !w.job_id)
      .filter((w) => !phases.length || phases.includes(w.phase as WorkflowPhase))
    return delay({ items, total: items.length })
  }

  #bulkMatches(request: BulkRequest): WorkflowItem[] {
    const { q, phases, workflow_kinds, finished_before_hours, environment } = request.filter
    const text = q?.trim().toLowerCase()
    const limit =
      finished_before_hours == null ? null : Date.now() - finished_before_hours * 3_600_000
    return this.#workflowItems(environment ?? 'all')
      .filter((w) => !text || w.name.includes(text) || w.job_id?.startsWith(text))
      .filter((w) => !phases?.length || phases.includes(w.phase as WorkflowPhase))
      .filter((w) => !workflow_kinds?.length || workflow_kinds.includes(w.workflow_kind ?? ''))
      .filter((w) => limit == null || (!!w.finished_at && Date.parse(w.finished_at) < limit))
      .filter((w) => !request.workflow_names || request.workflow_names.includes(w.name))
  }

  // newest first, at most limit of them like the backend
  #bulkLimit(matches: WorkflowItem[], request: BulkRequest): WorkflowItem[] {
    const newest = (w: WorkflowItem) => Date.parse(w.started_at ?? '') || 0
    return [...matches].sort((a, b) => newest(b) - newest(a)).slice(0, request.limit ?? 1000)
  }

  async #bulkRun(action: BulkAction, w: WorkflowItem) {
    if (!w.job_id) {
      // Argo acts on the workflow alone, there is no job record to update
      const orphan = this.#orphans.get(w.name)
      if (!orphan) throw new AdminApiError(404, 'workflow not found')
      if (action === 'delete') this.#orphans.delete(w.name)
      else if (action === 'stop') orphan.phase = 'Failed'
      else if (action === 'resume') orphan.suspended = false
      else
        Object.assign(orphan, {
          phase: action === 'retry' ? 'Running' : 'Pending',
          finished_at: null,
        })
      return
    }
    if (action === 'delete') this.#workflows.delete(w.job_id)
    else await this[action](w.job_id)
  }

  async bulk(request: BulkRequest) {
    const all = this.#bulkMatches(request)
    const matches = this.#bulkLimit(all, request)
    const total = all.length
    const truncated = total > matches.length
    const needsData = request.action === 'retry' || request.action === 'resubmit'
    const item = (w: WorkflowItem): BulkItem => {
      const deleted = needsData && !this.#dataAvailable(w)
      const applies = bulkApplicable(request.action, w.phase, !!w.suspended)
      const running = request.action === 'delete' && !applies
      return {
        name: w.name,
        job_id: w.job_id,
        workflow_kind: w.workflow_kind,
        phase: w.phase,
        finished_at: w.finished_at,
        applicable: !deleted && applies,
        result: null,
        error: null,
        reason: deleted ? inputsDeletedReason : running ? stillRunningReason : null,
      }
    }
    if (request.dry_run) {
      return delay({
        dry_run: true,
        action: request.action,
        total,
        truncated,
        items: matches.map(item),
      })
    }
    const names = request.workflow_names ?? matches.map((w) => w.name)
    const items = await Promise.all(
      names.map(async (name): Promise<BulkItem> => {
        const w = matches.find((m) => m.name === name)
        if (!w) {
          return {
            name,
            phase: 'Unknown',
            applicable: false,
            result: 'failed',
            error: 'workflow not found',
          }
        }
        const result = item(w)
        if (!result.applicable) return { ...result, result: 'skipped' }
        try {
          await this.#bulkRun(request.action, w)
          return { ...result, result: 'done' }
        } catch (e) {
          return { ...result, result: 'failed', error: e instanceof Error ? e.message : String(e) }
        }
      }),
    )
    return delay({ dry_run: false, action: request.action, total, truncated, items })
  }
}

export function createMockAdminApi(): AdminApi {
  return new MockAdminApi()
}
