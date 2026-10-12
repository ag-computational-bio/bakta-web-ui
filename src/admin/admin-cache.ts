import type { AdminApi } from './admin-api'

/*
 * A short-lived memory cache for the GET requests of the admin API, keyed by
 * the path with the query. A page shows the cached answer at once and then
 * the answer of the server (stale while revalidate). Changes by admin actions
 * and the logout clear it.
 */

// how long an answer is kept
export const cacheTime = 30_000

/**
 * Thrown by the cached API when it has no recent answer for a request.
 */
export class NotCachedError extends Error {
  constructor(path: string) {
    super(`No cached answer for ${path}`)
  }
}

export class AdminCache {
  #entries = new Map<string, { value: unknown; time: number }>()
  #pending = new Map<string, Promise<unknown>>()
  // counts the clears, so an answer to a request from before a clear is not kept
  #generation = 0
  #now: () => number

  // "now" is a parameter for the tests
  constructor(now = () => Date.now()) {
    this.#now = now
  }

  /**
   * The recent answer for the key, undefined when there is none.
   */
  peek(key: string): unknown {
    const entry = this.#entries.get(key)
    if (entry && this.#now() - entry.time < cacheTime) return entry.value
    this.#entries.delete(key)
    return undefined
  }

  /**
   * Loads the key. A load of the same key that is still running is shared.
   * The answer is kept, unless the cache was cleared while it loaded.
   */
  fetch(key: string, load: () => Promise<unknown>): Promise<unknown> {
    const pending = this.#pending.get(key)
    if (pending) return pending
    const generation = this.#generation
    const promise = load()
      .then((value) => {
        if (generation === this.#generation) {
          this.#entries.set(key, { value, time: this.#now() })
        }
        return value
      })
      .finally(() => {
        if (this.#pending.get(key) === promise) this.#pending.delete(key)
      })
    this.#pending.set(key, promise)
    return promise
  }

  clear() {
    this.#generation++
    this.#entries.clear()
    this.#pending.clear()
  }
}

/**
 * Stale while revalidate: "show" gets the recent answer from the cache at
 * once, when there is one, and then the answer of the server. A cached answer
 * that comes after the server answer is not shown. Returns the server
 * answer, errors of the server request are thrown.
 */
export async function loadCachedFirst<T>(
  api: AdminApi,
  load: (api: AdminApi) => Promise<T>,
  show: (data: T, cached: boolean) => void,
): Promise<T> {
  let answered = false
  if (api.cached) {
    load(api.cached).then(
      (data) => {
        if (!answered) show(data, true)
      },
      () => undefined,
    )
  }
  const data = await load(api)
  answered = true
  show(data, false)
  return data
}
