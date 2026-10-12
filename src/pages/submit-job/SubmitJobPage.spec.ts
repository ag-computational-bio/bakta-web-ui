import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const workflows = [
  { workflowKind: 'bakta' },
  { workflowKind: 'baktfold' },
  { workflowKind: 'bakta_proteins' },
]

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/page/page', () => ({
  useBaktaService: () => ({ workflows: () => Promise.resolve(workflows), submitJob: vi.fn() }),
}))
// the other forms are not needed here
const emptyForm = defineComponent({ setup: () => () => h('div') })
vi.mock('./components/SubmitBaktfoldForm.vue', () => ({ default: emptyForm }))
vi.mock('./components/SubmitBaktaProteinsForm.vue', () => ({ default: emptyForm }))

const { default: SubmitJobPage } = await import('./SubmitJobPage.vue')

enableAutoUnmount(afterEach)

describe('SubmitJobPage', () => {
  it('keeps an invalid locus tag visible after switching tabs', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue('>contig1\nACGTACGTACGT')
    await page.find('#locustag').setValue('bc10_AB461')
    await page.find('#compliant').setValue(true)
    expect(page.find('#locustag').classes()).toContain('is-invalid')
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()

    const tab = (label: string) => page.findAll('.nav-link').find((b) => b.text() === label)!
    await tab('Baktfold').trigger('click')
    await tab('Bakta').trigger('click')

    expect(page.find('#locustag').classes()).toContain('is-invalid')
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
  })
})
