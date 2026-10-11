import { describe, expect, it, vi } from 'vitest'
import type { BulkRequest, BulkResult } from './admin-api'
import { bulkScope, useBulkPreview } from './bulk-preview'

const list = { q: '', environment: 'production' as const, kinds: [], statuses: [], phases: [] }

describe('bulkScope', () => {
  it('maps the statuses with a clear phase and lists the others', () => {
    const scope = bulkScope({ ...list, q: ' abc ', statuses: ['failed', 'error', 'deleted'] })
    expect(scope).toMatchObject({
      q: 'abc',
      phases: ['Failed', 'Error'],
      unusedStatuses: ['deleted'],
      empty: false,
    })
  })

  it('combines statuses and phases like the job list', () => {
    expect(
      bulkScope({ ...list, statuses: ['failed'], phases: ['Failed', 'Running'] }).phases,
    ).toEqual(['Failed'])
    const none = bulkScope({ ...list, statuses: ['running'], phases: ['Failed'] })
    expect(none).toMatchObject({ phases: [], empty: true })
    expect(bulkScope({ ...list, statuses: ['created'], phases: ['Pending'] }).phases).toEqual([
      'Pending',
    ])
  })
})

function item(name: string, applicable = true) {
  return { name, phase: 'Failed', applicable }
}

function deferred() {
  let resolve!: (r: BulkResult) => void
  const promise = new Promise<BulkResult>((r) => (resolve = r))
  return { promise, resolve }
}

describe('useBulkPreview', () => {
  it('never deletes a pending or running workflow', async () => {
    const bulk = vi.fn(async (r: BulkRequest) => ({
      action: r.action,
      dry_run: r.dry_run,
      items: [
        { name: 'a', phase: 'Running', applicable: true },
        { name: 'b', phase: 'Pending', applicable: true },
        { name: 'c', phase: 'Failed', applicable: true },
      ],
    }))
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.action.value = 'delete'
    p.scope.value = bulkScope(list)
    await p.load()
    expect(p.applicable.value.map((w) => w.name)).toEqual(['c'])
    await p.run()
    expect(bulk.mock.calls[1][0].workflow_names).toEqual(['c'])
    // c may run again after the preview, so the run asks only for finished phases
    expect(bulk.mock.calls[1][0].filter.phases).toEqual(['Succeeded', 'Failed', 'Error'])
  })

  it('runs the action of the shown preview on exactly its applicable workflows', async () => {
    const bulk = vi.fn(async (r: BulkRequest) => ({
      action: r.action,
      dry_run: r.dry_run,
      items: r.dry_run
        ? [item('a'), item('b', false)]
        : [{ ...item('a'), result: 'done' as const }],
    }))
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.action.value = 'retry'
    p.scope.value = bulkScope({ ...list, statuses: ['failed'] })
    p.hours.value = 24
    await p.load()
    expect(p.applicable.value.map((w) => w.name)).toEqual(['a'])
    await p.run()
    expect(bulk).toHaveBeenLastCalledWith({
      filter: {
        q: undefined,
        phases: ['Failed'],
        workflow_kinds: undefined,
        finished_before_hours: 24,
        environment: 'production',
      },
      action: 'retry',
      dry_run: false,
      workflow_names: ['a'],
    })
    expect(p.results.value?.[0].result).toBe('done')
  })

  it('drops a late preview of an earlier action', async () => {
    const first = deferred()
    const second = deferred()
    const bulk = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.scope.value = bulkScope(list)
    p.action.value = 'delete'
    const a = p.load()
    p.action.value = 'retry'
    const b = p.load()
    second.resolve({ action: 'retry', dry_run: true, items: [item('new')] })
    first.resolve({ action: 'delete', dry_run: true, items: [item('old')] })
    await Promise.all([a, b])
    expect(p.preview.value?.request.action).toBe('retry')
    expect(p.preview.value?.items.map((w) => w.name)).toEqual(['new'])
  })

  it('clears the preview when a setting changes, so it cannot be run', async () => {
    const bulk = vi.fn(async (r: BulkRequest) => ({
      action: r.action,
      dry_run: r.dry_run,
      items: [item('a')],
    }))
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.scope.value = bulkScope(list)
    await p.load()
    p.hours.value = 5
    expect(p.preview.value).toBeUndefined()
    await p.run()
    expect(bulk).toHaveBeenCalledTimes(1)
  })

  it('does not ask the server when status and phase exclude each other', async () => {
    const bulk = vi.fn()
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.scope.value = bulkScope({ ...list, statuses: ['running'], phases: ['Failed'] })
    await p.load()
    expect(bulk).not.toHaveBeenCalled()
    expect(p.preview.value?.items).toEqual([])
  })

  it('locks the settings during a run and keeps its result', async () => {
    const real = deferred()
    const bulk = vi.fn(async (r: BulkRequest) =>
      r.dry_run ? { action: r.action, dry_run: true, items: [item('a')] } : real.promise,
    )
    const p = useBulkPreview({ bulk, jobs: vi.fn() }, String)
    p.scope.value = bulkScope(list)
    await p.load()
    const first = p.run()
    expect(p.running.value).toBe(true)
    // neither a second run, a new preview nor changed settings stop the first run
    await p.run()
    p.hours.value = 5
    await p.load()
    p.scope.value = undefined
    expect(p.busy.value).toBe(true)
    expect(bulk).toHaveBeenCalledTimes(2)
    real.resolve({ action: 'delete', dry_run: false, items: [{ ...item('a'), result: 'done' }] })
    await first
    expect(p.running.value).toBe(false)
    expect(p.results.value?.map((w) => w.result)).toEqual(['done'])
  })

  it('limits the preview to the workflows of the jobs the search finds', async () => {
    const jobs = vi.fn(async ({ offset = 0 }: { offset?: number }) => ({
      total: 501,
      items: offset
        ? [{ workflow_name: 'w-2' }]
        : [{ workflow_name: 'w-1' }, { workflow_name: null }],
    }))
    const bulk = vi.fn(async (r: BulkRequest) => ({ action: r.action, dry_run: true, items: [] }))
    const p = useBulkPreview({ bulk, jobs: jobs as never }, String)
    p.scope.value = bulkScope({ ...list, q: 'coli' })
    await p.load()
    expect(jobs).toHaveBeenCalledTimes(2)
    expect(jobs).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'coli', environment: 'production', offset: 500 }),
    )
    const request = bulk.mock.calls[0][0]
    expect(request.filter).not.toHaveProperty('q')
    expect(request.workflow_names).toEqual(['w-1', 'w-2'])
  })

  it('shows an empty preview when the search finds no workflows', async () => {
    const jobs = vi.fn(async () => ({ total: 0, items: [] }))
    const bulk = vi.fn()
    const p = useBulkPreview({ bulk, jobs: jobs as never }, String)
    p.scope.value = bulkScope({ ...list, q: 'nothing' })
    await p.load()
    expect(bulk).not.toHaveBeenCalled()
    expect(p.preview.value?.items).toEqual([])
  })
})
