import type { Meta, StoryObj } from '@storybook/vue3'

import { expect, fn, userEvent } from '@storybook/test'
import SelectDermType from './SelectDermType.vue'
const meta: Meta<typeof SelectDermType> = {
  component: SelectDermType,
}

export default meta
type Story = StoryObj<typeof SelectDermType>

export const Default: Story = {
  args: {
    modelValue: 'MONODERM',
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvas, step, args }) => {
    const combobox = canvas.getByRole('combobox')
    expect(combobox).toHaveValue('MONODERM')
    expect(combobox).toHaveTextContent(/Monoderm/)
    expect(combobox).toHaveTextContent(/Diderm/)
    expect(combobox).toHaveTextContent(/\\?/)

    await userEvent.selectOptions(combobox, 'DIDERM')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('DIDERM')
    await userEvent.selectOptions(combobox, '?')
    await expect(args['onUpdate:modelValue']).toHaveBeenLastCalledWith('UNKNOWN')
  },
}
