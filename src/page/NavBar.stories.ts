import type { Meta, StoryObj } from '@storybook/vue3'

import { expect } from '@storybook/test'
import NavBar from './NavBar.vue'
const meta: Meta<typeof NavBar> = {
  component: NavBar,
}

export default meta
type Story = StoryObj<typeof NavBar>

export const Default: Story = {
  args: {
    active: '/',
  },
}
export const WithSelectedElement: Story = {
  args: {
    active: 'Jobs',
  },
  play: async ({ canvas }) => {
    const el = canvas.getByText('Jobs')
    await expect(el).toHaveClass('active')
  },
}
