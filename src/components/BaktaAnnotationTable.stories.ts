import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaAnnotationTable from './BaktaAnnotationTable.vue'
import { fixtures } from '@/test-data/bakta-results'

const meta: Meta<typeof BaktaAnnotationTable> = {
  component: BaktaAnnotationTable,
}

export default meta
type Story = StoryObj<typeof BaktaAnnotationTable>

export const BaktaPre1_10Data: Story = {
  args: {
    data: fixtures.result['<1.9'],
  },
}

export const Bakta1_10Data: Story = {
  args: {
    data: fixtures.result['1.10'],
  },
}
export const Bakta1_9Data: Story = {
  args: {
    data: fixtures.result['1.9'],
  },
}
