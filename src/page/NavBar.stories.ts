import type { Meta, StoryObj } from '@storybook/vue3'

import NavBar from './NavBar.vue'
import { expect, fn } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof NavBar> = {
  component: NavBar,
}

export default meta
type Story = StoryObj<typeof NavBar>

export const Default: Story = {
  args: {},
}
export const WithSelectedElement: Story = {
  args: {
    active: 'Jobs',
  },
  play: async ({ canvas, step }) => {
    const el = canvas.getByText('Jobs')
    await expect(el).toHaveClass('active')
  },
}
