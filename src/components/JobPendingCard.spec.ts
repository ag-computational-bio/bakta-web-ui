import type { StageLog } from '@/model/submit'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JobPendingCard from './JobPendingCard.vue'

const stages = (content: string): StageLog[] => [{ stage: 'annotate', status: 'running', content }]

// jsdom has no layout, so the log gets a fixed size: 1000 px of text in a 100 px box
function layout(el: HTMLElement) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 })
}

describe('JobPendingCard', () => {
  it('follows new log lines only when the reader is at the end', async () => {
    const wrapper = mount(JobPendingCard, { props: { stages: stages('line 1') } })
    await wrapper.find('button.btn-link').trigger('click')
    await flushPromises()
    const log = wrapper.find('pre').element as HTMLElement
    layout(log)

    // the reader scrolled up: neither new nor unchanged content moves the log
    log.scrollTop = 200
    await wrapper.setProps({ stages: stages('line 1') })
    await flushPromises()
    expect(log.scrollTop).toBe(200)
    await wrapper.setProps({ stages: stages('line 1\nline 2') })
    await flushPromises()
    expect(log.scrollTop).toBe(200)

    // at the end the log follows the new lines
    log.scrollTop = 900
    await wrapper.setProps({ stages: stages('line 1\nline 2\nline 3') })
    await flushPromises()
    expect(log.scrollTop).toBe(1000)
  })
})
