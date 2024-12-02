import type { Meta, StoryObj } from '@storybook/vue3'

import SelectTranslationTable from './SelectTranslationTable.vue'
import { expect, fn, userEvent } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof SelectTranslationTable> = {
  component: SelectTranslationTable,
}

export default meta
type Story = StoryObj<typeof SelectTranslationTable>

export const Default: Story = {
  args: {
    modelValue: 4,
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvas, args }) => {
    const combobox = canvas.getByRole('combobox')
    expect(combobox).toHaveValue('4')
    await userEvent.selectOptions(combobox, '11')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith(11)
  },
}
export const Table11: Story = {
  args: {
    modelValue: 11,
    'onUpdate:modelValue': fn(),
  },
}
export const UnknownTable: Story = {
  args: {
    modelValue: 1,
    'onUpdate:modelValue': fn(),
  },
}
