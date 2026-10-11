import type { WorkflowLogs } from '@/model/submit'
import {
  AdminApiError,
  type AdminApi,
  type AdminJobStatus,
  type Bucket,
  type CleanupRequest,
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
} from './admin-api'
import { createJobs, day, uuid } from './admin-mock-data'
import { percentile, truncDate } from './format'

/*
 * A fake admin API for development and previews ("admin": { "mock": true } in
 * config.json). It generates a few hundred jobs over two years in the browser.
 * Only the admin session loads this module, and only in mock mode.
 */

function inFilter(job: JobRecord, filter: StatsFilter): boolean {
  if (filter.environment !== 'all' && job.environment !== filter.environment) return false
  if (filter.from && job.created_at < new Date(filter.from).toISOString()) return false
  if (filter.to && job.created_at > new Date(filter.to).toISOString()) return false
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

const finishedStatuses: AdminJobStatus[] = ['succeeded', 'failed', 'error']
const activeStatuses: AdminJobStatus[] = ['created', 'submitted', 'running']

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

  #orphanDeleted = false

  #find(id: string): JobRecord {
    const job = this.#jobs.find((j) => j.id === id)
    if (!job) throw new AdminApiError(404, 'job not found')
    return job
  }

  #filtered(filter: StatsFilter) {
    return this.#jobs.filter((j) => inFilter(j, filter))
  }

  me() {
    return delay({ username: 'mock', name: 'Mock Admin', email: null, groups: ['bakta-admin'] })
  }

  summary(filter: StatsFilter) {
    const jobs = this.#filtered(filter)
    const count = (s: AdminJobStatus) => jobs.filter((j) => j.status === s).length
    const finished = jobs.filter((j) => finishedStatuses.includes(j.status)).length
    const kinds = [...new Set(jobs.map((j) => j.workflow_kind))]
    return delay({
      jobs_total: jobs.length,
      jobs_finished: finished,
      jobs_succeeded: count('succeeded'),
      jobs_failed: count('failed'),
      jobs_error: count('error'),
      jobs_active: jobs.filter((j) => activeStatuses.includes(j.status)).length,
      success_rate: finished ? count('succeeded') / finished : null,
      runtime_seconds: stats(jobs.map((j) => j.runtime_seconds)),
      queue_seconds: stats(jobs.map((j) => j.queue_seconds)),
      total_input_bp: jobs.reduce((sum, j) => sum + (j.total_length ?? 0), 0),
      by_workflow_kind: kinds.map((kind) => {
        const ofKind = jobs.filter((j) => j.workflow_kind === kind)
        return {
          workflow_kind: kind,
          jobs_total: ofKind.length,
          jobs_succeeded: ofKind.filter((j) => j.status === 'succeeded').length,
          runtime_seconds: stats(ofKind.map((j) => j.runtime_seconds)),
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
      const runtime = stats(jobs.map((j) => j.runtime_seconds))
      return {
        period_start: start.replace('.000Z', 'Z'),
        group: groupBy === 'none' ? null : group,
        jobs_total: jobs.length,
        jobs_succeeded: jobs.filter((j) => j.status === 'succeeded').length,
        jobs_failed: jobs.filter((j) => j.status === 'failed' || j.status === 'error').length,
        runtime_p50: runtime.p50,
        runtime_avg: runtime.avg,
        total_input_bp: jobs.reduce((sum, j) => sum + (j.total_length ?? 0), 0),
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

  jobs(query: JobQuery) {
    const q = query.q?.toLowerCase()
    const jobs = this.#filtered(query)
      .filter((j) => !query.status?.length || query.status.includes(j.status))
      .filter((j) => !query.workflowKind?.length || query.workflowKind.includes(j.workflow_kind))
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
        ...j,
        organism: [j.genus, j.species, j.strain].filter(Boolean).join(' ') || null,
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
    job.status = status
    job.updated_at = new Date().toISOString()
    this.#workflows.add(id)
    return delay({ workflow_name: job.workflow_name ?? '', phase: phaseOf(status) })
  }

  retry(id: string) {
    const job = this.#find(id)
    if (job.status !== 'failed' && job.status !== 'error') {
      return Promise.reject(new AdminApiError(409, 'workflow is not failed'))
    }
    return this.#setPhase(id, 'running', false)
  }

  resubmit(id: string) {
    return this.#setPhase(id, 'submitted', true)
  }

  stop(id: string) {
    if (this.#find(id).status !== 'running') {
      return Promise.reject(new AdminApiError(409, 'workflow is not running'))
    }
    return this.#setPhase(id, 'failed', false)
  }

  deleteJob(id: string, purgeData: boolean) {
    const job = this.#find(id)
    const existed = this.#workflows.delete(id)
    job.status = 'deleted'
    return delay({ deleted_workflow: existed, purged_objects: purgeData ? 12 : 0 })
  }

  #workflowItems(environment: Environment): WorkflowItem[] {
    const items: WorkflowItem[] = this.#jobs
      .filter((j) => this.#workflows.has(j.id))
      .filter((j) => environment === 'all' || j.environment === environment)
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
      }))
    if (this.#orphanDeleted) return items
    const orphan = new Date(Date.now() - 3 * day).toISOString()
    items.push({
      name: 'bakta-job-1.12.2-orphan',
      job_id: null,
      workflow_kind: null,
      phase: 'Error',
      template: 'bakta-job-1.12.2',
      environment: 'production',
      started_at: orphan,
      finished_at: orphan,
      message: 'pod deleted',
    })
    return items
  }

  workflows(environment: Environment, phases: WorkflowPhase[]) {
    const items = this.#workflowItems(environment)
    return delay(items.filter((w) => !phases.length || phases.includes(w.phase as WorkflowPhase)))
  }

  cleanup(request: CleanupRequest) {
    const limit = Date.now() - request.older_than_hours * 3_600_000
    const matches = this.#workflowItems(request.environment)
      .filter((w) => request.phases.includes(w.phase as WorkflowPhase))
      .filter((w) => w.finished_at && Date.parse(w.finished_at) < limit)
    if (!request.dry_run) {
      for (const w of matches) {
        if (w.job_id) this.#workflows.delete(w.job_id)
        else this.#orphanDeleted = true
      }
    }
    return delay({ dry_run: request.dry_run, workflows: matches })
  }
}

export function createMockAdminApi(): AdminApi {
  return new MockAdminApi()
}
