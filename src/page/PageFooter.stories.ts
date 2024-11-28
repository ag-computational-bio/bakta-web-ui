import type { Meta, StoryObj } from '@storybook/vue3'

import PageFooter from './PageFooter.vue'
import { fn } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof PageFooter> = {
  component: PageFooter,
}

export default meta
type Story = StoryObj<typeof PageFooter>

export const Default: Story = {
  args: {},
}
