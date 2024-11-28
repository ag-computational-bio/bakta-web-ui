import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaAnnotationTable from './BaktaAnnotationTable.vue'
import bakta_1_10 from '@/bakta-result-post-1_10.json'
import bakta_pre_1_10 from '@/bakta-result-pre-1_10.json'
import { parseBaktaData } from '@/model/result-data'

const oldData = parseBaktaData(bakta_pre_1_10)
const newData = parseBaktaData(bakta_1_10)

const meta: Meta<typeof BaktaAnnotationTable> = {
  component: BaktaAnnotationTable,
}

export default meta
type Story = StoryObj<typeof BaktaAnnotationTable>

export const BaktaPre1_10Data: Story = {
  args: {
    data: oldData,
  },
}

export const Bakta1_10Data: Story = {
  args: {
    data: newData,
  },
}
