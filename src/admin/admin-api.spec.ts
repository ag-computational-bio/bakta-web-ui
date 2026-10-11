import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError, createHttpAdminApi, queryString } from './admin-api'
import { adminApiUrl } from './admin-config'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('adminApiUrl', () => {
  it('replaces the API version with admin', () => {
    expect(adminApiUrl('https://api.bakta.computational.bio/api/v2')).toBe(
      'https://api.bakta.computational.bio/api/admin',
    )
    expect(adminApiUrl('/api/v2/')).toBe('/api/admin')
  })
})

describe('queryString', () => {
  it('leaves out empty values and joins lists', () => {
    expect(queryString({ a: undefined, b: '', c: [], d: ['x', 'y'], e: 0, f: false })).toBe(
      '?d=x%2Cy&e=0&f=false',
    )
    expect(queryString({})).toBe('')
  })
})

describe('http admin api', () => {
  it('sends the access token and the query', async () => {
    const fetch = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ total: 0, items: [] })))
    const api = createHttpAdminApi('/api/admin', () => Promise.resolve('token-1'))
    await api.jobs({ environment: 'all', status: ['failed', 'error'], q: 'coli', limit: 50 })
    expect(fetch.mock.calls[0][0]).toBe(
      '/api/admin/jobs?environment=all&status=failed%2Cerror&q=coli&limit=50',
    )
    const headers = fetch.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token-1')
  })

  it('keeps the status and message of errors', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'not an admin' }), { status: 403 }),
    )
    const api = createHttpAdminApi('/api/admin', () => Promise.resolve('token-1'))
    const error = await api.me().catch((e) => e)
    expect(error).toBeInstanceOf(AdminApiError)
    expect(error.status).toBe(403)
    expect(error.message).toBe('not an admin')
  })
})
