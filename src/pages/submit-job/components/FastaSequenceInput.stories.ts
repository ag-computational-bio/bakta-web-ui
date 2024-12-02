import type { Meta, StoryObj } from '@storybook/vue3'

import FastaSequenceInput from './FastaSequenceInput.vue'
import { expect, fn, userEvent } from '@storybook/test'
const meta: Meta<typeof FastaSequenceInput> = {
  component: FastaSequenceInput,
}

export default meta
type Story = StoryObj<typeof FastaSequenceInput>

export const Default: Story = {
  args: {
    'onUpdate:sequences': fn(),
  },
  play: async ({ canvas, args }) => {
    const el = canvas.getByRole('textbox')
    await userEvent.clear(el)
    await userEvent.type(el, '123')
    await expect(el).toBeInvalid()

    await userEvent.clear(el)
    await userEvent.type(el, '>123')
    await expect(el).toBeValid()
    await expect(args['onUpdate:sequences']).toHaveBeenLastCalledWith({
      sequence: '>123',
      parsed: [
        {
          id: '123',
          header: '>123',
          sequence: '',
        },
      ],
    })
  },
}
