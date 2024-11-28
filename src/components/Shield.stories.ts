import type { Meta, StoryObj } from '@storybook/vue3'

import Shield from './Shield.vue'
import { fn } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof Shield> = {
  component: Shield,
}

export default meta
type Story = StoryObj<typeof Shield>

export const Empty: Story = {
  args: {},
}
export const OtherIcon: Story = {
  args: {
    icon: 'bi-chevron-up',
  },
}
export const WithText: Story = {
  render: () => ({
    components: { Shield },
    template: '<Shield>Text</Shield>',
  }),
}
