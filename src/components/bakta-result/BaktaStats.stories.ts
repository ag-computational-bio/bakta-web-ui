import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaStats from './BaktaStats.vue'
import { fixtures } from '@/test-data/bakta-results'

const meta: Meta<typeof BaktaStats> = {
  component: BaktaStats,
}
export default meta
type Story = StoryObj<typeof BaktaStats>

const job = {
  jobID: '',
  name: '',
  ResultFiles: {
    FNA: '#',
  },
  started: new Date().toISOString(),
  updated: new Date().toISOString(),
}
export const BaktaPre1_10Data: Story = {
  args: {
    data: fixtures.result['<1.9'],
    job: job,
  },
}
export const Bakta1_10Data: Story = {
  args: {
    data: fixtures.result['1.10'],
    job: job,
  },
}
export const Bakta1_9Data: Story = {
  args: {
    data: fixtures.result['1.9'],
    job: job,
  },
}
