import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { JobPage, JobQuery } from '../admin-api'

const route = { query: {}, hash: '' }
const api = { jobs: vi.fn() }

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock('../admin-session', () => ({ useAdminApi: () => api, handleAdminError: String }))
// the sections below the list are not needed here
const empty = defineComponent({
  setup: (_, { expose }) => (expose({ load() {}, reveal() {} }), () => h('div')),
})
vi.mock('../components/OrphanWorkflows.vue', () => ({ default: empty }))
vi.mock('../components/BulkActionModal.vue', () => ({ default: empty }))
vi.mock('../components/AdminFilterBar.vue', () => ({ default: empty }))

const { default: AdminJobsPage } = await import('./AdminJobsPage.vue')

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

function jobPage(...organisms: string[]): JobPage {
  return {
    total: organisms.length,
    items: organisms.map((organism, i) => ({
      id: `job-${i}-${organism}`,
      environment: 'production',
      workflow_kind: 'bakta',
      status: 'succeeded',
      organism,
      created_at: '2026-10-01T00:00:00Z',
      data_expires_at: '2026-10-31T00:00:00Z',
      data_available: true,
    })),
  } as JobPage
}

const stubs = { RouterLink: true, JobRowActions: true }

// pages of earlier tests must not load again
enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const searches = () => api.jobs.mock.calls.map((call) => (call[0] as JobQuery).q)

describe('AdminJobsPage search', () => {
  it('waits for a pause in typing and keeps the rows while the new ones load', async () => {
    api.jobs.mockResolvedValueOnce(jobPage('Escherichia coli', 'Bacillus subtilis'))
    const wrapper = mount(AdminJobsPage, { global: { stubs } })
    await flushPromises()
    expect(searches()).toEqual([undefined])

    const next = deferred<JobPage>()
    api.jobs.mockReturnValueOnce(next.promise)
    const input = wrapper.get('input[type="search"]')
    for (const text of ['c', 'co', 'col', 'coli']) {
      await input.setValue(text)
      vi.advanceTimersByTime(100)
    }
    // still typing: no request yet
    expect(searches()).toEqual([undefined])
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(searches()).toEqual([undefined, 'coli'])
    // the previous rows stay, no empty list while loading
    expect(wrapper.text()).toContain('Bacillus subtilis')
    expect(wrapper.text()).not.toContain('No jobs found')

    next.resolve(jobPage('Escherichia coli'))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Bacillus subtilis')
    expect(wrapper.text()).toContain('Escherichia coli')
  })

  it('does not request the same list again', async () => {
    api.jobs.mockResolvedValue(jobPage('Escherichia coli'))
    const wrapper = mount(AdminJobsPage, { global: { stubs } })
    await flushPromises()
    const input = wrapper.get('input[type="search"]')
    await input.setValue('coli')
    vi.advanceTimersByTime(300)
    await flushPromises()
    // spaces around the search do not change the request
    await input.setValue(' coli ')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(searches()).toEqual([undefined, 'coli'])
  })

  it('keeps the newer list when the answer for the older search comes late', async () => {
    api.jobs.mockResolvedValueOnce(jobPage())
    const wrapper = mount(AdminJobsPage, { global: { stubs } })
    await flushPromises()
    const old = deferred<JobPage>()
    api.jobs.mockReturnValueOnce(old.promise).mockResolvedValueOnce(jobPage('Bacillus subtilis'))
    const input = wrapper.get('input[type="search"]')
    await input.setValue('coli')
    vi.advanceTimersByTime(300)
    await input.setValue('subtilis')
    vi.advanceTimersByTime(300)
    await flushPromises()
    old.resolve(jobPage('Escherichia coli'))
    await flushPromises()
    expect(searches()).toEqual([undefined, 'coli', 'subtilis'])
    expect(wrapper.text()).toContain('Bacillus subtilis')
    expect(wrapper.text()).not.toContain('Escherichia coli')
  })
})
