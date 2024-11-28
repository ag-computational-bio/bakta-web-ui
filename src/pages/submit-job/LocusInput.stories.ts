import type { Meta, StoryObj } from '@storybook/vue3'

import LocusInput from './LocusInput.vue'
import { expect, fn, userEvent } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof LocusInput> = {
  component: LocusInput,
}

export default meta
type Story = StoryObj<typeof LocusInput>

export const Default: Story = {
  args: {
    modelValue: '',
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
    await expect(el).toBeValid()

    await insert('#.*_-')
    await expect(el).toBeValid()

    await insert('01234567890123456789')
    await expect(el).toBeValid()

    await insert('012345678901234567890')
    await expect(el).toBeInvalid()

    await insert('&')
    await expect(el).toBeInvalid()
  },
}
