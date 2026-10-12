import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConfirmModal from './ConfirmModal.vue'

describe('ConfirmModal', () => {
  it('is named by its title', () => {
    const wrapper = mount(ConfirmModal, { props: { title: 'Delete the job?', confirmLabel: 'OK' } })
    const id = wrapper.find('.modal').attributes('aria-labelledby')
    expect(id).toBeTruthy()
    expect(wrapper.find(`[id="${id}"]`).text()).toBe('Delete the job?')
    wrapper.unmount()
  })
})
