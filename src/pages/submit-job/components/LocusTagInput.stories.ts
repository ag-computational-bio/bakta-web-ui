import type { Meta, StoryObj } from '@storybook/vue3'

import { ref } from 'vue'
import { expect, fn, userEvent } from 'storybook/test'
import LocusTagInput from './LocusTagInput.vue'
const meta: Meta<typeof LocusTagInput> = {
  component: LocusTagInput,
}

export default meta
type Story = StoryObj<typeof LocusTagInput>

export const Default: Story = {
  render: (args) => ({
    components: { LocusTagInput },
    setup: () => ({ args, value: ref(args.modelValue) }),
    template: '<LocusTagInput v-model="value" :compliant="args.compliant" />',
  }),
  args: {
    modelValue: 'XXX',
    'onUpdate:modelValue': fn(),
    compliant: true,
  },
  play: async ({ canvas }) => {
    const el = canvas.getByRole('textbox')
    async function insert(t: string) {
      await userEvent.clear(el)
      await userEvent.type(el, t)
    }
    await userEvent.clear(el)
    await expect(el).not.toHaveClass('is-invalid')

    await insert('a')
    await expect(el).toHaveClass('is-invalid')
    await insert('A')
    await expect(el).toHaveClass('is-invalid')

    await insert('ACC')
    await expect(el).not.toHaveClass('is-invalid')

    await insert('A12345678901')
    await expect(el).not.toHaveClass('is-invalid')

    await insert('A123456789012')
    await expect(el).toHaveClass('is-invalid')

    await insert('#.*_-')
    await expect(el).toHaveClass('is-invalid')
  },
}
