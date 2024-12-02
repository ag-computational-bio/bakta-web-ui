import type { Meta, StoryObj } from '@storybook/vue3'

import { expect, fn, userEvent } from '@storybook/test'
import SelectTopology from './SelectTopology.vue'
const meta: Meta<typeof SelectTopology> = {
  component: SelectTopology,
}

export default meta
type Story = StoryObj<typeof SelectTopology>

export const Linear: Story = {
  args: {
    modelValue: 'l',
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvas, args }) => {
    const combobox = canvas.getByRole('combobox')
    expect(combobox).toHaveValue('l')
    await userEvent.selectOptions(combobox, 'c')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('c')
    await userEvent.selectOptions(combobox, '?')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('UNKNOWN')
  },
}
