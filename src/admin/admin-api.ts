import { stripLogEndMarkers } from '@/model/bakta-api'
import { WorkflowKindSchema } from '@/model/job'
import { StageStatuses, type WorkflowLogs } from '@/model/submit'
import { z } from 'zod'

/*
 * Client for the admin API of the backend. The contract is
 * docs/admin-api.md in the bakta-web-backend repository.
 */

export const Environments = ['production', 'staging', 'all'] as const
export type Environment = (typeof Environments)[number]

export const AdminJobStatuses = [
  'created',
  'submitted',
  'running',
  'succeeded',
  'failed',
  'error',
  'deleted',
  'expired',
] as const
export const AdminJobStatusSchema = z.enum(AdminJobStatuses)
export type AdminJobStatus = z.infer<typeof AdminJobStatusSchema>

export const WorkflowPhases = ['Pending', 'Running', 'Succeeded', 'Failed', 'Error'] as const
export type WorkflowPhase = (typeof WorkflowPhases)[number]

export const Intervals = ['day', 'week', 'month', 'year'] as const
export type Interval = (typeof Intervals)[number]

export const GroupBys = ['none', 'workflow_kind', 'status', 'api_version'] as const
export type GroupBy = (typeof GroupBys)[number]

export const JobSorts = [
  'created_at',
  '-created_at',
  'runtime_seconds',
  '-runtime_seconds',
  'total_length',
  '-total_length',
] as const
export type JobSort = (typeof JobSorts)[number]

const time = z.string()
const optionalTime = z.string().nullish()
const optionalNumber = z.number().nullish()
const optionalText = z.string().nullish()

export const AdminUserSchema = z.object({
  username: z.string(),
  name: optionalText,
  email: optionalText,
  groups: z.array(z.string()),
})
export type AdminUser = z.infer<typeof AdminUserSchema>

const PercentilesSchema = z.object({
  avg: optionalNumber,
  p50: optionalNumber,
  p90: optionalNumber,
  p99: optionalNumber,
})
export type Percentiles = z.infer<typeof PercentilesSchema>

export const StatsSummarySchema = z.object({
  jobs_total: z.number(),
  jobs_finished: z.number(),
  jobs_succeeded: z.number(),
  jobs_failed: z.number(),
  jobs_error: z.number(),
  jobs_active: z.number(),
  success_rate: optionalNumber,
  runtime_seconds: PercentilesSchema,
  queue_seconds: PercentilesSchema,
  total_input_bp: optionalNumber,
  by_workflow_kind: z.array(
    z.object({
      workflow_kind: z.string(),
      jobs_total: z.number(),
      jobs_succeeded: z.number(),
      runtime_seconds: PercentilesSchema,
    }),
  ),
})
export type StatsSummary = z.infer<typeof StatsSummarySchema>

const BucketSchema = z.object({
  period_start: time,
  group: z.string().nullable(),
  jobs_total: z.number(),
  jobs_succeeded: z.number(),
  jobs_failed: z.number(),
  runtime_p50: optionalNumber,
  runtime_avg: optionalNumber,
  total_input_bp: optionalNumber,
})
export type Bucket = z.infer<typeof BucketSchema>

export const TimeseriesSchema = z.object({
  interval: z.enum(Intervals),
  group_by: z.enum(GroupBys),
  buckets: z.array(BucketSchema),
})
export type Timeseries = z.infer<typeof TimeseriesSchema>

export const VersionStatsSchema = z.object({
  items: z.array(
    z.object({
      bakta_version: optionalText,
      bakta_db_version: optionalText,
      baktfold_version: optionalText,
      jobs_total: z.number(),
      first_seen: optionalTime,
      last_seen: optionalTime,
    }),
  ),
})
export type VersionStats = z.infer<typeof VersionStatsSchema>

const JobListItemSchema = z.object({
  id: z.string(),
  environment: z.string(),
  workflow_kind: WorkflowKindSchema,
  status: AdminJobStatusSchema,
  organism: optionalText,
  sequence_count: optionalNumber,
  total_length: optionalNumber,
  created_at: time,
  finished_at: optionalTime,
  runtime_seconds: optionalNumber,
})
export type JobListItem = z.infer<typeof JobListItemSchema>

export const JobPageSchema = z.object({
  total: z.number(),
  items: z.array(JobListItemSchema),
})
export type JobPage = z.infer<typeof JobPageSchema>

export const JobRecordSchema = z.object({
  id: z.string(),
  environment: z.string(),
  workflow_kind: WorkflowKindSchema,
  api_version: z.string(),
  status: AdminJobStatusSchema,
  name: optionalText,
  genus: optionalText,
  species: optionalText,
  strain: optionalText,
  sequence_count: optionalNumber,
  total_length: optionalNumber,
  config: z.record(z.string(), z.unknown()).nullish(),
  bakta_version: optionalText,
  bakta_db_version: optionalText,
  baktfold_version: optionalText,
  baktfold_db_version: optionalText,
  workflow_name: optionalText,
  created_at: time,
  submitted_at: optionalTime,
  started_at: optionalTime,
  finished_at: optionalTime,
  runtime_seconds: optionalNumber,
  queue_seconds: optionalNumber,
  error_message: optionalText,
  updated_at: time,
})
export type JobRecord = z.infer<typeof JobRecordSchema>

const WorkflowNodeSchema = z.object({
  name: z.string(),
  display_name: z.string(),
  type: z.string(),
  phase: z.string(),
  pod_name: optionalText,
  started_at: optionalTime,
  finished_at: optionalTime,
  message: optionalText,
})
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>

const LiveWorkflowSchema = z.object({
  name: z.string(),
  phase: z.string(),
  started_at: optionalTime,
  finished_at: optionalTime,
  message: optionalText,
  nodes: z.array(WorkflowNodeSchema),
})
export type LiveWorkflow = z.infer<typeof LiveWorkflowSchema>

export const JobDetailSchema = z.object({
  job: JobRecordSchema,
  workflow: LiveWorkflowSchema.nullable(),
})
export type JobDetail = z.infer<typeof JobDetailSchema>

const LogsSchema = z.object({
  workflow_kind: WorkflowKindSchema,
  stages: z.array(
    z.object({ stage: z.string(), status: z.enum(StageStatuses), content: z.string() }),
  ),
})

export const ActionResultSchema = z.object({
  workflow_name: z.string(),
  phase: z.string(),
})
export type ActionResult = z.infer<typeof ActionResultSchema>

export const DeleteResultSchema = z.object({
  deleted_workflow: z.boolean(),
  purged_objects: z.number(),
})
export type DeleteResult = z.infer<typeof DeleteResultSchema>

const WorkflowItemSchema = z.object({
  name: z.string(),
  job_id: optionalText,
  workflow_kind: optionalText,
  phase: z.string(),
  template: optionalText,
  environment: optionalText,
  started_at: optionalTime,
  finished_at: optionalTime,
  message: optionalText,
})
export type WorkflowItem = z.infer<typeof WorkflowItemSchema>

export const WorkflowListSchema = z.object({ items: z.array(WorkflowItemSchema) })

export type CleanupRequest = {
  phases: WorkflowPhase[]
  older_than_hours: number
  environment: Environment
  dry_run: boolean
}

export const CleanupResultSchema = z.object({
  dry_run: z.boolean(),
  workflows: z.array(
    z.object({
      name: z.string(),
      job_id: optionalText,
      phase: z.string(),
      finished_at: optionalTime,
    }),
  ),
})
export type CleanupResult = z.infer<typeof CleanupResultSchema>

export type StatsFilter = {
  environment: Environment
  from?: string
  to?: string
}

export type JobQuery = StatsFilter & {
  status?: AdminJobStatus[]
  workflowKind?: string[]
  q?: string
  limit?: number
  offset?: number
  sort?: JobSort
}

export interface AdminApi {
  me(): Promise<AdminUser>
  summary(filter: StatsFilter): Promise<StatsSummary>
  timeseries(filter: StatsFilter, interval: Interval, groupBy: GroupBy): Promise<Timeseries>
  versions(filter: StatsFilter): Promise<VersionStats>
  jobs(query: JobQuery): Promise<JobPage>
  job(id: string): Promise<JobDetail>
  jobLogs(id: string): Promise<WorkflowLogs>
  retry(id: string): Promise<ActionResult>
  resubmit(id: string): Promise<ActionResult>
  stop(id: string): Promise<ActionResult>
  deleteJob(id: string, purgeData: boolean): Promise<DeleteResult>
  workflows(environment: Environment, phases: WorkflowPhase[]): Promise<WorkflowItem[]>
  cleanup(request: CleanupRequest): Promise<CleanupResult>
}

/**
 * An error answer of the admin API. The status tells a missing login (401)
 * apart from a missing admin group (403).
 */
export class AdminApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined>

export function queryString(query: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == undefined || value === '') continue
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(','))
    } else {
      params.set(key, String(value))
    }
  }
  const text = params.toString()
  return text ? '?' + text : ''
}

function filterQuery(filter: StatsFilter): Query {
  return { environment: filter.environment, from: filter.from, to: filter.to }
}

export function toWorkflowLogs(payload: unknown): WorkflowLogs {
  const logs = LogsSchema.parse(payload)
  return {
    workflowKind: logs.workflow_kind,
    stages: logs.stages.map((stage) => ({
      ...stage,
      content: stripLogEndMarkers(stage.content),
    })),
  }
}

class HttpAdminApi implements AdminApi {
  #baseUrl: string
  #token: () => Promise<string | undefined>

  constructor(baseUrl: string, token: () => Promise<string | undefined>) {
    this.#baseUrl = baseUrl
    this.#token = token
  }

  async #request(method: string, path: string, body?: unknown): Promise<unknown> {
    const token = await this.#token()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (body != undefined) headers['Content-Type'] = 'application/json'
    const response = await window.fetch(this.#baseUrl + path, {
      method,
      headers,
      body: body == undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    let payload: unknown = undefined
    try {
      payload = text ? JSON.parse(text) : undefined
    } catch {
      payload = text
    }
    if (response.ok) return payload
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `${response.status} ${response.statusText}`
    throw new AdminApiError(response.status, message)
  }

  async me() {
    return AdminUserSchema.parse(await this.#request('GET', '/me'))
  }

  async summary(filter: StatsFilter) {
    const path = '/stats/summary' + queryString(filterQuery(filter))
    return StatsSummarySchema.parse(await this.#request('GET', path))
  }

  async timeseries(filter: StatsFilter, interval: Interval, groupBy: GroupBy) {
    const query = { ...filterQuery(filter), interval, group_by: groupBy }
    const path = '/stats/timeseries' + queryString(query)
    return TimeseriesSchema.parse(await this.#request('GET', path))
  }

  async versions(filter: StatsFilter) {
    const path = '/stats/versions' + queryString(filterQuery(filter))
    return VersionStatsSchema.parse(await this.#request('GET', path))
  }

  async jobs(query: JobQuery) {
    const path =
      '/jobs' +
      queryString({
        ...filterQuery(query),
        status: query.status,
        workflow_kind: query.workflowKind,
        q: query.q,
        limit: query.limit,
        offset: query.offset,
        sort: query.sort,
      })
    return JobPageSchema.parse(await this.#request('GET', path))
  }

  async job(id: string) {
    return JobDetailSchema.parse(await this.#request('GET', `/jobs/${encodeURIComponent(id)}`))
  }

  async jobLogs(id: string) {
    return toWorkflowLogs(await this.#request('GET', `/jobs/${encodeURIComponent(id)}/logs`))
  }

  async #action(id: string, action: 'retry' | 'resubmit' | 'stop') {
    const path = `/jobs/${encodeURIComponent(id)}/${action}`
    return ActionResultSchema.parse(await this.#request('POST', path))
  }

  retry(id: string) {
    return this.#action(id, 'retry')
  }

  resubmit(id: string) {
    return this.#action(id, 'resubmit')
  }

  stop(id: string) {
    return this.#action(id, 'stop')
  }

  async deleteJob(id: string, purgeData: boolean) {
    const path = `/jobs/${encodeURIComponent(id)}` + queryString({ purge_data: purgeData })
    return DeleteResultSchema.parse(await this.#request('DELETE', path))
  }

  async workflows(environment: Environment, phases: WorkflowPhase[]) {
    const path = '/workflows' + queryString({ environment, phase: phases })
    return WorkflowListSchema.parse(await this.#request('GET', path)).items
  }

  async cleanup(request: CleanupRequest) {
    return CleanupResultSchema.parse(await this.#request('POST', '/cleanup', request))
  }
}

export function createHttpAdminApi(
  baseUrl: string,
  token: () => Promise<string | undefined>,
): AdminApi {
  return new HttpAdminApi(baseUrl, token)
}
