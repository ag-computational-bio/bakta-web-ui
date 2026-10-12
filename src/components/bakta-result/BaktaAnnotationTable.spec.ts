import { fixtures } from '@/test-data/bakta-results'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

const dt = vi.hoisted(() => {
  const api = { page: vi.fn(), draw: vi.fn() }
  api.page.mockReturnValue(api)
  return api
})

// the DataTables table itself is not needed, only its page
vi.mock('datatables.net-vue3', () => {
  const DataTable = defineComponent({
    props: ['data', 'columns', 'options', 'tableId'],
    setup(_, { expose }) {
      expose({ dt: ref(dt) })
      return () => h('table')
    },
  })
  return { default: Object.assign(DataTable, { use: () => {} }) }
})

const { default: BaktaAnnotationTable } = await import('./BaktaAnnotationTable.vue')

describe('BaktaAnnotationTable', () => {
  it('goes to the first page when the feature type changes', async () => {
    const wrapper = mount(BaktaAnnotationTable, { props: { data: fixtures.result['1.10'] } })
    await wrapper.findAll('.feature-chip')[1].trigger('click')
    await nextTick()
    await nextTick()
    expect(dt.page).toHaveBeenCalledWith(0)
    expect(dt.draw).toHaveBeenCalledWith(false)
  })
})
