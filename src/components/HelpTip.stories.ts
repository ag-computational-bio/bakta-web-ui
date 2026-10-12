import type { Meta, StoryObj } from '@storybook/vue3'

import HelpTip from './HelpTip.vue'

const meta: Meta<typeof HelpTip> = {
  component: HelpTip,
}

export default meta
type Story = StoryObj<typeof HelpTip>

export const Default: Story = {
  args: {
    text: 'Gram type for signal peptide prediction.',
  },
}
