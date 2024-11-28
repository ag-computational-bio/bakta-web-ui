import type { Meta, StoryObj } from '@storybook/vue3'

import PageHeader from './PageHeader.vue'
const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    version: { dbVersion: '1.1.1', toolVersion: '12.1.4' },
    page: 'Jobs',
  },
}
