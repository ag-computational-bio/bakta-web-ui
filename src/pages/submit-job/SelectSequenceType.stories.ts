import type { Meta, StoryObj } from '@storybook/vue3'

import SelectSequenceType from './SelectSequenceType.vue'
import { expect, fn, userEvent } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof SelectSequenceType> = {
  component: SelectSequenceType,
}

export default meta
type Story = StoryObj<typeof SelectSequenceType>

export const Default: Story = {
  args: {
    modelValue: 'contig',
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvas, step, args }) => {
    const combobox = canvas.getByRole('combobox')
    expect(combobox).toHaveValue('contig')
    expect(combobox).toHaveTextContent(/Contig/)
    expect(combobox).toHaveTextContent(/Chromosome/)
    expect(combobox).toHaveTextContent(/Plasmid/)
    expect(combobox).toHaveTextContent(/\\?/)

    await userEvent.selectOptions(combobox, 'plasmid')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('plasmid')
    await userEvent.selectOptions(combobox, '?')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('UNKNOWN')
  },
}
