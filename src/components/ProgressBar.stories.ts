import type { Meta, StoryObj } from '@storybook/vue3'

import { expect } from '@storybook/test'
import ProgressBar from './ProgressBar.vue'
const meta: Meta<typeof ProgressBar> = {
  component: ProgressBar,
}

export default meta
type Story = StoryObj<typeof ProgressBar>

export const Default: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'static', value: 0 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('0 %')
  },
}
export const _25Percent: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'static', value: 25 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('25 %')
  },
}
export const _50Percent: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'static', value: 50 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('50 %')
  },
}
export const _100Percent: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'static', value: 100 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('100 %')
  },
}
export const _100PercentIndeterminate: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'indeterminate', value: 100 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('100 %')
  },
}
export const WithCustomRange: Story = {
  args: {
    progress: { min: 0, max: 1, type: 'indeterminate', value: 0.5 },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole('progressbar')).toHaveTextContent('50 %')
  },
}
export const WithTitle: Story = {
  args: {
    progress: { min: 0, max: 100, type: 'indeterminate', value: 100, title: 'My title' },
  },
  play: async ({ canvas }) => {
    expect(canvas.getByText('My title')).toHaveTextContent('My title')
  },
}
