import type { Meta, StoryObj } from '@storybook/vue3'

import bakta_1_10 from '@/bakta-result-post-1_10.json'
import bakta_pre_1_10 from '@/bakta-result-pre-1_10.json'
import { parseBaktaData } from '@/model/result-data'
import BaktaStats from './BaktaStats.vue'

const oldData = parseBaktaData(bakta_pre_1_10)
const newData = parseBaktaData(bakta_1_10)

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
    data: oldData,
    job: job,
  },
}
export const Bakta1_10Data: Story = {
  args: {
    data: newData,
    job: job,
  },
}
