import type { Meta, StoryObj } from '@storybook/vue3'

import ch from '@/cog-helper'
import ColorLegend from './ColorLegend.vue'
import { featureColors } from './feature-colors'
const meta: Meta<typeof ColorLegend> = {
  component: ColorLegend,
}

export default meta
type Story = StoryObj<typeof ColorLegend>

export const EZBioCog: Story = {
  args: {
    colors: ch.ezBioCogColors,
  },
}
export const NCBICog: Story = {
  args: {
    colors: ch.ncbiCogColors,
  },
}
export const BaktaCog: Story = {
  args: {
    colors: ch.baktaCogColors,
  },
}
export const Features: Story = {
  args: {
    colors: featureColors,
  },
}
