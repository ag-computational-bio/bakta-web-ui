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
  it('runs the action of the shown preview on exactly its applicable workflows', async () => {
    const bulk = vi.fn(async (r: BulkRequest) => ({
      action: r.action,
      dry_run: r.dry_run,
      items: r.dry_run
        ? [item('a'), item('b', false)]
        : [{ ...item('a'), result: 'done' as const }],
    }))
    const p = useBulkPreview({ bulk }, String)
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
    const p = useBulkPreview({ bulk }, String)
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
    const p = useBulkPreview({ bulk }, String)
    p.scope.value = bulkScope(list)
    await p.load()
    p.hours.value = 5
    expect(p.preview.value).toBeUndefined()
    await p.run()
    expect(bulk).toHaveBeenCalledTimes(1)
  })

  it('does not ask the server when status and phase exclude each other', async () => {
    const bulk = vi.fn()
    const p = useBulkPreview({ bulk }, String)
    p.scope.value = bulkScope({ ...list, statuses: ['running'], phases: ['Failed'] })
    await p.load()
    expect(bulk).not.toHaveBeenCalled()
    expect(p.preview.value?.items).toEqual([])
  })
})
