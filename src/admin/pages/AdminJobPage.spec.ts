import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { JobDetail } from '../admin-api'

const route = reactive({ params: { id: 'a' } })
const confirmation = vi.hoisted(() => ({ open: () => Promise.resolve(true) }))
const api = { job: vi.fn(), jobLogs: vi.fn(), deleteJob: vi.fn() }

vi.mock('vue-router', () => ({
  useRoute: () => route,
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('../admin-session', () => ({ useAdminApi: () => api, handleAdminError: String }))
// the Bootstrap modal is not needed here, the test decides when it confirms
vi.mock('../components/ConfirmModal.vue', () => ({
  default: defineComponent({
    setup(_, { expose, slots }) {
      expose({ open: () => confirmation.open() })
      return () => h('div', slots.default?.())
    },
  }),
}))

const { default: AdminJobPage } = await import('./AdminJobPage.vue')

function detail(id: string): JobDetail {
  return {
    job: {
      id,
      environment: 'production',
      workflow_kind: 'bakta',
      api_version: 'v2',
      status: 'succeeded',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    },
  } as JobDetail
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const stubs = { WorkflowLogViewer: true, DisplayTuple: true }

beforeEach(() => {
  route.params.id = 'a'
  vi.resetAllMocks()
  confirmation.open = () => Promise.resolve(true)
  api.jobLogs.mockReturnValue(new Promise(() => {}))
})

describe('AdminJobPage', () => {
  it('keeps the newer job when the answer for the older one comes late', async () => {
    const a = deferred<JobDetail>()
    api.job.mockReturnValueOnce(a.promise).mockResolvedValueOnce(detail('b'))
    const wrapper = mount(AdminJobPage, { global: { stubs } })
    route.params.id = 'b'
    await flushPromises()
    a.resolve(detail('a'))
    await flushPromises()
    expect(wrapper.find('h3').text()).toBe('b')
  })

  it('deletes the job that is shown', async () => {
    api.job.mockResolvedValue(detail('b'))
    api.deleteJob.mockResolvedValue({ deleted_workflow: true, purged_objects: 0 })
    route.params.id = 'b'
    const wrapper = mount(AdminJobPage, { global: { stubs } })
    await flushPromises()
    const remove = wrapper.findAll('button').find((b) => b.text() === 'Delete')!
    await remove.trigger('click')
    await flushPromises()
    expect(api.deleteJob).toHaveBeenCalledWith('b', false)
  })

  it('does nothing when another job was opened during the confirmation', async () => {
    const confirmed = deferred<boolean>()
    api.job.mockResolvedValueOnce(detail('a')).mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mount(AdminJobPage, { global: { stubs } })
    await flushPromises()
    confirmation.open = () => confirmed.promise
    const remove = wrapper.findAll('button').find((b) => b.text() === 'Delete')!
    await remove.trigger('click')
    route.params.id = 'b'
    confirmed.resolve(true)
    await flushPromises()
    expect(api.deleteJob).not.toHaveBeenCalled()
  })
})
