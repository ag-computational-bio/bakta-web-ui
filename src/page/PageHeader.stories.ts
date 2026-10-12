import type { Meta, StoryObj } from '@storybook/vue3'

import PageHeader from './PageHeader.vue'
const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    version: {
      backendVersion: '1.0.0',
      baktaVersion: '12.1.4',
      baktaDbVersion: '1.1.1',
      baktfoldVersion: '0.9.0',
      baktfoldDbVersion: '0.4.0',
    },
    page: 'Jobs',
  },
}
