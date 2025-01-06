import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaFavIcon from './BaktaFavIcon.vue'
const meta: Meta<typeof BaktaFavIcon> = {
  component: BaktaFavIcon,
}

export default meta
type Story = StoryObj<typeof BaktaFavIcon>

export const Default: Story = {
  args: {},
}
