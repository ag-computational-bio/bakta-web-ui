import { describe, expect, it, vi } from 'vitest'

const manager = vi.hoisted(() => ({ getUser: vi.fn(), signinSilent: vi.fn() }))
vi.mock('oidc-client-ts', () => ({
  UserManager: vi.fn(function () {
    return manager
  }),
  WebStorageStateStore: vi.fn(),
}))

const { createAdminAuth } = await import('./admin-auth')

describe('createAdminAuth', () => {
  it('renews an expired token only once for parallel requests', async () => {
    manager.getUser.mockResolvedValue({ expired: true, access_token: 'old' })
    let finish!: (user: unknown) => void
    manager.signinSilent.mockReturnValue(new Promise((r) => (finish = r)))
    const auth = createAdminAuth('https://auth.example.org/realms/bakta', 'bakta-admin')
    const tokens = Promise.all([auth.accessToken(), auth.accessToken(), auth.accessToken(true)])
    await new Promise((r) => setTimeout(r))
    finish({ expired: false, access_token: 'new' })
    expect(await tokens).toEqual(['new', 'new', 'new'])
    expect(manager.signinSilent).toHaveBeenCalledOnce()
  })
})
