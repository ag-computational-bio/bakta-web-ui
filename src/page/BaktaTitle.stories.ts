import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaTitle from './BaktaTitle.vue'

const meta: Meta<typeof BaktaTitle> = {
  component: BaktaTitle,
}

export default meta
type Story = StoryObj<typeof BaktaTitle>

export const Default: Story = {
  args: {
    version: {
      backendVersion: '1.0.0',
      baktaVersion: 'xy',
      baktaDbVersion: '123',
      baktfoldVersion: '0.9.0',
      baktfoldDbVersion: '456',
    },
  },
}
