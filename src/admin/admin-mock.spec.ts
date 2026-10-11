import { describe, expect, it } from 'vitest'
import {
  JobDetailSchema,
  JobPageSchema,
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
})
