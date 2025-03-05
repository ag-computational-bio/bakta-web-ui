import type { Meta, StoryObj } from '@storybook/vue3'

import StylisedCircPlot from './StylisedCircPlot.vue'
const meta: Meta<typeof StylisedCircPlot> = {
  component: StylisedCircPlot,
}

export default meta
type Story = StoryObj<typeof StylisedCircPlot>

export const Default: Story = {
  args: {},
}
