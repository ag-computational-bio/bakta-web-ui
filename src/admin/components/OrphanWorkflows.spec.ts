import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import OrphanWorkflows from './OrphanWorkflows.vue'

const workflows = vi.fn()
vi.mock('../admin-session', () => ({
  useAdminApi: () => ({ workflows }),
  handleAdminError: String,
}))
vi.mock('../admin-cache', () => ({
  loadCachedFirst: async (
    api: unknown,
    load: (api: unknown) => Promise<unknown>,
    show: (r: unknown) => void,
  ) => show(await load(api)),
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ hash: '' }) }))

const items = [{ name: 'w1', phase: 'Failed' }]

describe('OrphanWorkflows', () => {
  it('shows the total and a note when the list is cut', async () => {
    workflows.mockResolvedValue({ items, total: 2345 })
    const wrapper = mount(OrphanWorkflows)
    await flushPromises()
    expect(wrapper.text()).toContain('Workflows without a job record (2345)')
    expect(wrapper.text()).toContain('Showing the newest 1 of 2,345.')
    wrapper.unmount()
  })

  it('shows no note when all workflows are listed', async () => {
    workflows.mockResolvedValue({ items, total: 1 })
    const wrapper = mount(OrphanWorkflows)
    await flushPromises()
    expect(wrapper.text()).not.toContain('Showing the newest')
    wrapper.unmount()
  })
})
