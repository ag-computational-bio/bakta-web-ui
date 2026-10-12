import { describe, expect, it, vi } from 'vitest'
import { initAdminConfig, useAdminConfig } from './admin-config'

const api = 'https://api.example.org/api/v2'

describe('initAdminConfig', () => {
  it('uses mock mode in development builds', () => {
    initAdminConfig(api, { mock: true }, true)
    expect(useAdminConfig().mock).toBe(true)
  })

  it('ignores mock mode in production builds with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    initAdminConfig(api, { mock: true }, false)
    expect(useAdminConfig()).toMatchObject({
      mock: false,
      api: 'https://api.example.org/api/admin',
    })
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})
