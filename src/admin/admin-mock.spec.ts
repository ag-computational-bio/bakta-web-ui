import { describe, expect, it } from 'vitest'
import {
  JobDetailSchema,
  JobPageSchema,
  RuntimeStatsSchema,
  StatsSummarySchema,
  TimeseriesSchema,
  VersionStatsSchema,
} from './admin-api'
import { createMockAdminApi } from './admin-mock'

const api = createMockAdminApi()
const all = { environment: 'all' as const }

describe('mock admin api', () => {
  it('returns data that matches the contract', async () => {
    StatsSummarySchema.parse(await api.summary(all))
    TimeseriesSchema.parse(await api.timeseries(all, 'week', 'status'))
    VersionStatsSchema.parse(await api.versions(all))
    RuntimeStatsSchema.parse(await api.runtimes(all, 'bakta'))
    const page = JobPageSchema.parse(await api.jobs({ ...all, limit: 10 }))
    JobDetailSchema.parse(await api.job(page.items[0].id))
  })

  it('has a few hundred jobs with every status', async () => {
    const page = await api.jobs({ ...all, limit: 500 })
    expect(page.total).toBeGreaterThan(300)
    const statuses = new Set(page.items.map((j) => j.status))
    expect(statuses.size).toBeGreaterThanOrEqual(7)
  })

  it('filters, sorts and pages the job list', async () => {
    const failed = await api.jobs({ ...all, status: ['failed'], sort: '-runtime_seconds' })
    expect(failed.items.every((j) => j.status === 'failed')).toBe(true)
    const runtimes = failed.items.map((j) => j.runtime_seconds ?? 0)
    expect(runtimes).toEqual([...runtimes].sort((a, b) => b - a))
    const second = await api.jobs({ ...all, limit: 5, offset: 5 })
    const first = await api.jobs({ ...all, limit: 10 })
    expect(second.items.map((j) => j.id)).toEqual(first.items.slice(5).map((j) => j.id))
  })

  it('counts the same jobs in the summary and the time series', async () => {
    const summary = await api.summary(all)
    const series = await api.timeseries(all, 'month', 'workflow_kind')
    const total = series.buckets.reduce((sum, b) => sum + b.jobs_total, 0)
    expect(total).toBe(summary.jobs_total)
  })

  it('has fixed runtime buckets that count all succeeded jobs', async () => {
    const stats = await api.runtimes(all)
    expect(stats.histogram).toHaveLength(9)
    expect(stats.by_input_size).toHaveLength(7)
    expect(stats.histogram[8].max_seconds).toBeNull()
    expect(stats.histogram.reduce((sum, b) => sum + b.jobs, 0)).toBe(stats.jobs)
    expect(stats.slowest).toHaveLength(10)
    const kinds = await api.runtimes(all, 'baktfold')
    expect(kinds.by_workflow_kind.map((k) => k.workflow_kind)).toEqual(['baktfold'])
  })

  it('lists and runs bulk actions only on the previewed workflows', async () => {
    const filter = { environment: 'all' as const, phases: ['Failed' as const, 'Error' as const] }
    const preview = await api.bulk({ filter, action: 'retry', dry_run: true })
    expect(preview.items.length).toBeGreaterThan(0)
    const names = preview.items.filter((w) => w.applicable).map((w) => w.name)
    const orphans = preview.items.filter((w) => !w.job_id)
    expect(orphans.length).toBeGreaterThan(0)
    const run = await api.bulk({ filter, action: 'retry', dry_run: false, workflow_names: names })
    expect(run.items.map((w) => w.name)).toEqual(names)
    const done = run.items.filter((w) => w.result === 'done').length
    expect(done).toBe(names.length - orphans.length)
    const after = await api.bulk({ filter, action: 'retry', dry_run: true })
    expect(after.items.length).toBe(orphans.length)
  })

  it('lists workflows without a job record', async () => {
    const orphans = await api.workflows({ environment: 'all', orphans: true })
    expect(orphans.length).toBeGreaterThan(0)
    expect(orphans.every((w) => !w.job_id)).toBe(true)
  })
})
