import { describe, expect, it } from 'vitest'
import {
  JobDetailSchema,
  InputStatsSchema,
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
    InputStatsSchema.parse(await api.inputs(all))
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
    for (const kind of summary.by_workflow_kind) {
      expect(kind.jobs_finished).toBe(kind.jobs_succeeded + kind.jobs_failed + kind.jobs_error)
    }
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
    expect(kinds.overall?.p50).toBe(kinds.by_workflow_kind[0].p50)
    expect(stats.overall?.jobs).toBe(stats.jobs)
    expect(stats.overall?.max).toBe(stats.slowest[0].runtime_seconds)
  })

  it('lists and runs bulk actions only on the previewed workflows', async () => {
    const filter = { environment: 'all' as const, phases: ['Failed' as const, 'Error' as const] }
    const preview = await api.bulk({ filter, action: 'retry', dry_run: true })
    expect(preview.items.length).toBeGreaterThan(0)
    const names = preview.items.filter((w) => w.applicable).map((w) => w.name)
    expect(preview.items.some((w) => !w.job_id)).toBe(true)
    const run = await api.bulk({ filter, action: 'retry', dry_run: false, workflow_names: names })
    expect(run.items.map((w) => w.name)).toEqual(names)
    expect(run.items.every((w) => w.result === 'done')).toBe(true)
    const after = await api.bulk({ filter, action: 'retry', dry_run: true })
    // only the workflow whose data is gone is left
    expect(after.items.map((w) => w.name)).toEqual(['bakta-job-1.11.0-old'])
  })

  it('cuts a bulk preview at the limit and reports the total', async () => {
    const filter = { environment: 'all' as const }
    const full = await api.bulk({ filter, action: 'retry', dry_run: true })
    expect(full.truncated).toBe(false)
    const cut = await api.bulk({ filter, action: 'retry', dry_run: true, limit: 2 })
    expect(cut.items).toHaveLength(2)
    expect(cut.total).toBe(full.items.length)
    expect(cut.truncated).toBe(true)
  })

  it('lists workflows without a job record', async () => {
    const orphans = await api.workflows({ environment: 'all', orphans: true })
    expect(orphans.items.length).toBeGreaterThan(0)
    expect(orphans.items.every((w) => !w.job_id)).toBe(true)
    expect(orphans.total).toBe(orphans.items.length)
  })

  it('has fixed input buckets that count all jobs with a length', async () => {
    const stats = await api.inputs(all)
    expect(stats.size_histogram).toHaveLength(7)
    expect(stats.sequence_histogram).toHaveLength(7)
    expect(stats.sequence_histogram[0]).toMatchObject({ min_sequences: 1, max_sequences: 1 })
    expect(stats.size_histogram.reduce((sum, b) => sum + b.jobs, 0)).toBe(stats.jobs)
    expect(stats.largest).toHaveLength(10)
  })
})

describe('mock data retention', () => {
  const day = 86_400_000

  it('sets the expiry 30 days after the job finished or was created', async () => {
    const page = await api.jobs({ ...all, limit: 500 })
    for (const job of page.items) {
      const reference = Date.parse(job.finished_at ?? job.created_at)
      expect(Date.parse(job.data_expires_at)).toBe(reference + 30 * day)
      expect(job.data_available).toBe(Date.now() < reference + 30 * day)
    }
    expect(page.items.some((j) => !j.data_available)).toBe(true)
  })

  it('refuses what needs the deleted data', async () => {
    const mock = createMockAdminApi()
    const page = await mock.jobs({ ...all, status: ['failed'], limit: 500 })
    const job = page.items.find((j) => !j.data_available)!
    await expect(mock.retry(job.id)).rejects.toMatchObject({ status: 409 })
    await expect(mock.resubmit(job.id)).rejects.toMatchObject({
      status: 409,
      message: 'Input data was deleted after the retention period',
    })
    await expect(mock.jobLogs(job.id)).rejects.toMatchObject({ status: 410 })
    expect(await mock.deleteJob(job.id, true)).toEqual({
      deleted_workflow: false,
      purged_objects: 0,
    })
  })

  it('marks retry of a workflow without data as not applicable', async () => {
    const mock = createMockAdminApi()
    const preview = await mock.bulk({
      filter: { ...all, q: '1.11.0-old' },
      action: 'retry',
      dry_run: true,
    })
    expect(preview.items).toHaveLength(1)
    expect(preview.items[0]).toMatchObject({
      applicable: false,
      reason: 'Input data deleted after the retention period',
    })
    const deletion = await mock.bulk({
      filter: { ...all, q: '1.11.0-old' },
      action: 'delete',
      dry_run: true,
    })
    expect(deletion.items[0]).toMatchObject({ applicable: true, reason: null })
  })

  it('does not delete running workflows', async () => {
    const mock = createMockAdminApi()
    const filter = { ...all, phases: ['Running' as const] }
    const preview = await mock.bulk({ filter, action: 'delete', dry_run: true })
    expect(preview.items.length).toBeGreaterThan(0)
    for (const w of preview.items) {
      expect(w).toMatchObject({ applicable: false, reason: 'Still running, stop it first' })
    }
  })
})
