import type { Meta, StoryObj } from '@storybook/vue3'

import LocusInput from './LocusInput.vue'
import { ref } from 'vue'
import { expect, fn, userEvent } from 'storybook/test'

const meta: Meta<typeof LocusInput> = {
  component: LocusInput,
}

export default meta
type Story = StoryObj<typeof LocusInput>

export const Default: Story = {
  render: (args) => ({
    components: { LocusInput },
    setup: () => ({ args, value: ref(args.modelValue) }),
    template: '<LocusInput v-model="value" />',
  }),
  args: {
    modelValue: '',
    'onUpdate:modelValue': fn(),
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
    await expect(el).not.toHaveClass('is-invalid')

    await insert('#.*_-')
    await expect(el).not.toHaveClass('is-invalid')

    await insert('01234567890123456789')
    await expect(el).not.toHaveClass('is-invalid')

    await insert('012345678901234567890')
    await expect(el).toHaveClass('is-invalid')

    await insert('&')
    await expect(el).toHaveClass('is-invalid')
  },
}
