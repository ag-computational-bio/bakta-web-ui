import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHttpAdminApi, type AdminApi } from './admin-api'
import { AdminCache, cacheTime, loadCachedFirst } from './admin-cache'

afterEach(() => {
  vi.restoreAllMocks()
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const page = (total: number) => ({ total, items: [] })

describe('AdminCache', () => {
  it('keeps an answer for a short time', async () => {
    let now = 1000
    const cache = new AdminCache(() => now)
    await cache.fetch('/jobs', async () => 'a')
    expect(cache.peek('/jobs')).toBe('a')
    expect(cache.peek('/jobs?q=x')).toBeUndefined()
    now += cacheTime
    expect(cache.peek('/jobs')).toBeUndefined()
  })

  it('drops expired answers of other keys when it stores an answer', async () => {
    let now = 1000
    const cache = new AdminCache(() => now)
    await cache.fetch('/jobs/a/logs', async () => 'a')
    now += cacheTime - 1
    await cache.fetch('/jobs/b/logs', async () => 'b')
    now += 1
    await cache.fetch('/jobs/c/logs', async () => 'c')
    // with the clock set back, a kept answer would be recent again
    now = 1001
    expect(cache.peek('/jobs/a/logs')).toBeUndefined()
    expect(cache.peek('/jobs/b/logs')).toBe('b')
    expect(cache.peek('/jobs/c/logs')).toBe('c')
  })

  it('does not keep a failed request and tries again', async () => {
    const cache = new AdminCache()
    await expect(cache.fetch('/jobs', () => Promise.reject(new Error('down')))).rejects.toThrow()
    expect(cache.peek('/jobs')).toBeUndefined()
    expect(await cache.fetch('/jobs', async () => 'a')).toBe('a')
  })

  it('shares a running request for the same key', async () => {
    const cache = new AdminCache()
    const answer = deferred<string>()
    const load = vi.fn(() => answer.promise)
    const first = cache.fetch('/jobs', load)
    const second = cache.fetch('/jobs', load)
    answer.resolve('a')
    expect(await first).toBe('a')
    expect(await second).toBe('a')
    expect(load).toHaveBeenCalledTimes(1)
    // a finished request is not shared
    await cache.fetch('/jobs', async () => 'b')
    expect(cache.peek('/jobs')).toBe('b')
  })

  it('does not keep an answer to a request from before a clear', async () => {
    const cache = new AdminCache()
    const late = deferred<string>()
    const old = cache.fetch('/jobs', () => late.promise)
    cache.clear()
    // after the clear the same key starts a new request
    const fresh = cache.fetch('/jobs', async () => 'new')
    expect(await fresh).toBe('new')
    late.resolve('old')
    expect(await old).toBe('old')
    expect(cache.peek('/jobs')).toBe('new')
  })
})

describe('loadCachedFirst', () => {
  it('shows the cached answer at once and then the answer of the server', async () => {
    const server = deferred<number>()
    const api = { total: () => server.promise, cached: { total: async () => 1 } }
    const shown: [number, boolean][] = []
    const done = loadCachedFirst(
      api as unknown as AdminApi,
      (a) => (a as unknown as typeof api).total(),
      (value, cached) => shown.push([value, cached]),
    )
    await Promise.resolve()
    expect(shown).toEqual([[1, true]])
    server.resolve(2)
    expect(await done).toBe(2)
    expect(shown).toEqual([
      [1, true],
      [2, false],
    ])
  })

  it('never shows a cached answer after the answer of the server', async () => {
    const cached = deferred<number>()
    const api = { total: async () => 2, cached: { total: () => cached.promise } }
    const shown: [number, boolean][] = []
    await loadCachedFirst(
      api as unknown as AdminApi,
      (a) => (a as unknown as typeof api).total(),
      (value, isCached) => shown.push([value, isCached]),
    )
    cached.resolve(1)
    await Promise.resolve()
    expect(shown).toEqual([[2, false]])
  })

  it('throws the error of the server and ignores a missing cached answer', async () => {
    const api = {
      total: async () => Promise.reject(new Error('down')),
      cached: { total: async () => Promise.reject(new Error('not cached')) },
    }
    const show = vi.fn()
    await expect(
      loadCachedFirst(
        api as unknown as AdminApi,
        (a) => (a as unknown as typeof api).total(),
        show,
      ),
    ).rejects.toThrow('down')
    expect(show).not.toHaveBeenCalled()
  })
})

describe('http admin api cache', () => {
  function mockFetch() {
    let total = 0
    return vi
      .spyOn(window, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify(page(++total))))
  }

  it('answers from the cache and asks the server again', async () => {
    const fetch = mockFetch()
    const api = createHttpAdminApi('/api/admin', async () => 'token')
    await expect(api.cached!.jobs({ environment: 'all' })).rejects.toThrow()
    expect((await api.jobs({ environment: 'all' })).total).toBe(1)
    expect((await api.cached!.jobs({ environment: 'all' })).total).toBe(1)
    // another query has no cached answer
    await expect(api.cached!.jobs({ environment: 'staging' })).rejects.toThrow()
    expect((await api.jobs({ environment: 'all' })).total).toBe(2)
    expect((await api.cached!.jobs({ environment: 'all' })).total).toBe(2)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('sends one request for the same query at the same time', async () => {
    const fetch = mockFetch()
    const api = createHttpAdminApi('/api/admin', async () => 'token')
    const [a, b] = await Promise.all([
      api.jobs({ environment: 'all', q: 'coli' }),
      api.jobs({ environment: 'all', q: 'coli' }),
    ])
    expect(a).toEqual(b)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('drops the cache after actions that change data, not after a dry run', async () => {
    const fetch = mockFetch()
    const api = createHttpAdminApi('/api/admin', async () => 'token')
    const cachedJobs = () =>
      api.cached!.jobs({ environment: 'all' }).then(
        (p) => p.total,
        () => undefined,
      )
    await api.jobs({ environment: 'all' })
    await api.bulk({ filter: {}, action: 'delete', dry_run: true }).catch(() => undefined)
    expect(await cachedJobs()).toBe(1)
    const changes: (() => Promise<unknown>)[] = [
      () => api.retry('a'),
      () => api.resubmit('a'),
      () => api.stop('a'),
      () => api.resume('a'),
      () => api.deleteJob('a', false),
      () => api.bulk({ filter: {}, action: 'delete', dry_run: false }),
    ]
    for (const change of changes) {
      await api.jobs({ environment: 'all' })
      expect(await cachedJobs()).toBeDefined()
      // the answer does not matter, also a failed action may have changed something
      await change().catch(() => undefined)
      expect(await cachedJobs()).toBeUndefined()
    }
    expect(fetch).toHaveBeenCalledTimes(14)
  })
})
