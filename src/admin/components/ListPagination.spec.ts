import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ListPagination from './ListPagination.vue'

function create(page: number) {
  return mount(ListPagination, {
    props: { total: 120, label: 'jobs', page, pageSize: 25, 'onUpdate:page': () => {} },
  })
}

describe('ListPagination', () => {
  it('disables the buttons that lead outside the pages', () => {
    const first = create(1)
    expect(first.find('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(first.find('[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
    const last = create(5)
    expect(last.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    const gap = last.findAll('.page-link').find((b) => b.text() === '...')
    expect(gap?.attributes('disabled')).toBeDefined()
  })

  it('never sets a page before the first one', async () => {
    const wrapper = create(1)
    // a click event also reaches a button when it comes from a script or the keyboard
    ;(wrapper.find('[aria-label="Previous page"]').element as HTMLButtonElement).disabled = false
    await wrapper.find('[aria-label="Previous page"]').trigger('click')
    expect(wrapper.emitted('update:page')).toBeUndefined()
    await wrapper.find('[aria-label="Next page"]').trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[2]])
  })
})
