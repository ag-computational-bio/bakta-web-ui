import type { Meta, StoryObj } from '@storybook/vue3'

import FeaturePlotViewer from './FeaturePlotViewer.vue'
import { fn } from '@storybook/test'
import { ref } from 'vue'
import { fixtures, fixturesFn } from '@/test-data/bakta-results'
const meta: Meta<typeof FeaturePlotViewer> = {
  component: FeaturePlotViewer,
}

export default meta
type Story = StoryObj<typeof FeaturePlotViewer>
export const Default: Story = {
  args: {
    bakta: fixturesFn('1.10'),
  },
}
