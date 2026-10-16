import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { gzip } from 'pako'

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
  it.each([false, true])('accepts a non-INSDC FASTA file, gzip: %s', async (compressed) => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    const fasta = `>NODE_1_length_123456_cov_12.345678\n${'ACGT'.repeat(50)}`
    const files = new DataTransfer()
    files.items.add(
      new File(
        [compressed ? new Uint8Array(gzip(fasta)) : fasta],
        compressed ? 'input.fna.gz' : 'input.fna',
      ),
    )
    const input = page.find<HTMLInputElement>('#fastaFile')
    input.element.files = files.files
    await input.trigger('change')
    await vi.waitFor(() => expect(page.find('#keep-headers').exists()).toBe(true))
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
    await page.find('#compliant').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
  })

  it.each([
    'NODE_1_length_123456_cov_12.345678',
    'contig|1',
    'contig/1',
    'contig+1',
    'contig=1',
    'contig,1',
    '"contig1',
    'cöntig1',
  ])('allows retaining safe non-INSDC ID %s unless compliant output is selected', async (id) => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page
      .find('textarea[name="paste-fasta"]')
      .setValue(`>${id} description; with spaces\n${'ACGT'.repeat(50)}`)
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
    expect(page.text()).not.toContain('The contig ids are not INSDC compliant.')

    await page.find('#compliant').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('The contig ids are not INSDC compliant.')

    await page.find('#keep-headers').setValue(false)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
  })

  it.each(['', 'contig;1', 'contig\u0000x', 'contig\u007fx'])('rejects unsafe retained ID %j', async (id) => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue(`>${id}\nACGT`)
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('Contig IDs must not be empty')

    await page.find('#keep-headers').setValue(false)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
  })

  it('rejects duplicate retained IDs but allows automatic renaming', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue('>same first\nACGT\n>same second\nACGT')
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('Duplicate contig ID: same')

    await page.find('#keep-headers').setValue(false)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
  })

  it.each([25, 26])('checks the INSDC length boundary at %i characters', async (length) => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page
      .find('textarea[name="paste-fasta"]')
      .setValue(`>${'a'.repeat(length)}\n${'ACGT'.repeat(50)}`)
    await page.find('#keep-headers').setValue(true)
    await page.find('#compliant').setValue(true)
    expect(page.find('#submit-button').attributes('disabled') === undefined).toBe(length === 25)
  })

  it('rejects collisions between replacement and generated IDs', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue('>first\nACGT\n>second\nACGT')
    await page.find('.table-responsive input[placeholder="Optional..."]').setValue('contig_2')
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('Duplicate contig ID: contig_2')
  })

  it('validates the effective replacement IDs and ignores them when keeping headers', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue(`>original|1\n${'ACGT'.repeat(50)}`)
    const replacement = page.find('.table-responsive input[placeholder="Optional..."]')
    await replacement.setValue('safe1')
    await page.find('#compliant').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()

    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('The contig ids are not INSDC compliant.')

    await page.find('#keep-headers').setValue(false)
    await replacement.setValue('unsafe;1')
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    await page.find('#compliant').setValue(false)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
  })

  it('ignores replacement IDs in single-plasmid mode', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue('>original\nACGT')
    await page.find('.table-responsive input[placeholder="Optional..."]').setValue('unsafe;1')
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    await page.find('#plasmid').setValue('pTest')
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
  })

  it.each(['>contig|1\nACGU', '>contig|1\n'])('still rejects invalid or empty DNA: %j', async (input) => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue(input)
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
  })

  it('ignores filtered IDs and rejects input with no remaining sequences', async () => {
    const page = mount(SubmitJobPage)
    await flushPromises()
    await page.find('textarea[name="paste-fasta"]').setValue(`>bad;id\nACGT\n>safe\n${'ACGT'.repeat(50)}`)
    await page.find('#keep-headers').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    await page.find('#min-contig-length').setValue(5)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
    await page.find('#compliant').setValue(true)
    expect(page.find('#submit-button').attributes('disabled')).toBeUndefined()
    await page.find('#compliant').setValue(false)
    await page.find('#min-contig-length').setValue(201)
    expect(page.find('#submit-button').attributes('disabled')).toBeDefined()
    expect(page.text()).toContain('No sequences meet the minimum contig length.')
  })

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
