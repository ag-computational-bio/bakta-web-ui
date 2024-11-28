import type { Meta, StoryObj } from '@storybook/vue3'

import Notification from './Notification.vue'
import { fn } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof Notification> = {
  component: Notification,
}

export default meta
type Story = StoryObj<typeof Notification>

export const Default: Story = {
  args: {
    message: 'Test',
  },
}
export const Danger: Story = {
  args: {
    message: 'Test',
    type: 'danger',
  },
}
export const Warning: Story = {
  args: {
    message: 'Test',
    type: 'warning',
  },
}
export const Secondary: Story = {
  args: {
    message: 'Test',
    type: 'secondary',
  },
}
