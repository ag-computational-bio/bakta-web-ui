import type { Meta, StoryObj } from '@storybook/vue3'

import LocusTagInput from './LocusTagInput.vue'
import { expect, fn, userEvent } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof LocusTagInput> = {
  component: LocusTagInput,
}

export default meta
type Story = StoryObj<typeof LocusTagInput>

export const Default: Story = {
  args: {
    modelValue: 'XXX',
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvas, step }) => {
    const el = canvas.getByRole('textbox')
    async function insert(t: string) {
      await userEvent.clear(el)
      await userEvent.type(el, t)
    }
    await userEvent.clear(el)
    await expect(el).toBeValid()

    await insert('a')
    await expect(el).toBeInvalid()
    await insert('A')
    await expect(el).toBeInvalid()

    await insert('ACC')
    await expect(el).toBeValid()

    await insert('A12345678901')
    await expect(el).toBeValid()

    await insert('A123456789012')
    await expect(el).toBeInvalid()

    await insert('#.*_-')
    await expect(el).toBeInvalid()
  },
}
