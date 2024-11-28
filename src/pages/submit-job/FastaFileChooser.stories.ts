import type { Meta, StoryObj } from '@storybook/vue3'

import { expect, fn, userEvent } from '@storybook/test'
import FastaFileChooser from './FastaFileChooser.vue'
const meta: Meta<typeof FastaFileChooser> = {
  component: FastaFileChooser,
}

export default meta
type Story = StoryObj<typeof FastaFileChooser>

export const Default: Story = {
  args: {
    'onUpdate:sequence': fn(),
    'onUpdate:sequences': fn(),
  },
  play: async ({ canvasElement, args }) => {
    const filechooser = canvasElement.querySelector('input') as HTMLInputElement
    const file = new File(['>1\naaa'], '1.fas')
    await userEvent.upload(filechooser, file, { applyAccept: false, delay: 10 })
    await expect(args['onUpdate:sequence']).toHaveBeenLastCalledWith('>1\naaa')
    await expect(args['onUpdate:sequences']).toHaveBeenLastCalledWith([
      {
        id: '1',
        header: '>1',
        sequence: 'aaa',
      },
    ])
  },
}
export const InvalidFile: Story = {
  args: {
    'onUpdate:sequence': fn(),
    'onUpdate:sequences': fn(),
  },
  play: async ({ canvas, canvasElement, args }) => {
    const filechooser = canvasElement.querySelector('input') as HTMLInputElement
    const file = new File(['@@@'], '1.dat')
    await userEvent.upload(filechooser, file, { applyAccept: false, delay: 100 })
    await expect(args['onUpdate:sequence']).toHaveBeenLastCalledWith('')
    await expect(args['onUpdate:sequences']).toHaveBeenLastCalledWith([])
    expect(canvas.queryByRole('progressbar')).toBe(null)
    expect(canvas.queryByText(/Invalid fasta file/)).toHaveTextContent('Invalid fasta file')
  },
}
