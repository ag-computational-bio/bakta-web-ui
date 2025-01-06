import type { Meta, StoryObj } from '@storybook/vue3'

import DisplayTuple from './DisplayTuple.vue'
const meta: Meta<typeof DisplayTuple> = {
  component: DisplayTuple,
}

export default meta
type Story = StoryObj<typeof DisplayTuple>

export const Default: Story = {
  args: {
    label: 'Label',
    value: 'value',
  },
}
export const CustomBreakpoint: Story = {
  args: {
    label: 'Label',
    value: 'value',
    break: 6,
  },
}
