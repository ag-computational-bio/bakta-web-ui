import type { Meta, StoryObj } from '@storybook/vue3'

import { fixtures } from '@/test-data/bakta-results'
import BaktaResultVisualization from './BaktaResultVisualization.vue'
const meta: Meta<typeof BaktaResultVisualization> = {
  component: BaktaResultVisualization,
}

export default meta
type Story = StoryObj<typeof BaktaResultVisualization>

export const Default: Story = {
  args: {
    bakta: fixtures.result['1.10'],
    showShareButton: true,
    job: {
      jobID: '',
      name: '',
      ResultFiles: {
        FNA: '#',
      },
      started: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
  },
}
