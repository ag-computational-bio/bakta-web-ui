import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaTitle from './BaktaTitle.vue'
import { fn } from '@storybook/test'
import { ref } from 'vue'
const meta: Meta<typeof BaktaTitle> = {
  component: BaktaTitle,
}

export default meta
type Story = StoryObj<typeof BaktaTitle>

export const Default: Story = {
  args: {
    version: { dbVersion: '123', toolVersion: 'xy' },
  },
}
