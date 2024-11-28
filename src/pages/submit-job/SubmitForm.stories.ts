import type { Meta, StoryObj } from '@storybook/vue3'

import SubmitForm from './SubmitForm.vue'
import { expect, fn, userEvent } from '@storybook/test'
import { ref } from 'vue'
import { createBaktaJobRequest, type BaktaJobRequest } from '@/model/bakta-service'
const meta: Meta<typeof SubmitForm> = {
  component: SubmitForm,
}

export default meta
type Story = StoryObj<typeof SubmitForm>

export const Default: Story = {
  args: {
    modelValue: createBaktaJobRequest(),
    'onUpdate:modelValue': fn(),
  },
  render: (args) => ({
    components: { SubmitForm },
    setup() {
      const value = ref<BaktaJobRequest>(createBaktaJobRequest())
      function update(r: BaktaJobRequest) {
        value.value = r
      }
      return { value, args, update }
    },
    template: '<SubmitForm v-bind="args" v-model:="value" @update:modelValue="update" />',
  }),
  play: async ({ canvas, canvasElement, step }) => {
    const fastaTextInput = canvas.getByPlaceholderText(/Paste/)
    await step('Form is not visible by default', async () => {
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).toBe(null)
    })
    await step('Form is visible when valid fasta is provided as text', async () => {
      await userEvent.clear(fastaTextInput)
      await userEvent.type(fastaTextInput, '>123\nabc')
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).not.toBe(null)
    })

    await step('Form is hidden when fasta text is removed', async () => {
      await userEvent.clear(fastaTextInput)
      await userEvent.type(fastaTextInput, '>123\nabc')
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).not.toBe(null)
      await userEvent.clear(fastaTextInput)
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).toBe(null)
    })

    await step('Form is not visible when invalid fasta is provided as text', async () => {
      await userEvent.clear(fastaTextInput)
      await userEvent.type(fastaTextInput, '@@@')
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).toBe(null)
      await userEvent.clear(fastaTextInput)
    })

    const fileInput = canvasElement.querySelector('input[type="file"]') as HTMLInputElement
    await step('Form is visible when fasta file is selected', async () => {
      await userEvent.clear(fastaTextInput)
      const file = new File(['>1\natgc'], '1.fas')
      await userEvent.upload(fileInput, file, { applyAccept: false, delay: 100 })
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).not.toBe(null)
      await userEvent.click(canvas.getByText('Reset'))
      await expect(canvas.queryByPlaceholderText(/Locus prefix/)).toBe(null)
    })
  },
}
