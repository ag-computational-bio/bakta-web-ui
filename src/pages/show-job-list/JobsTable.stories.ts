import type { Meta, StoryObj } from '@storybook/vue3'

import JobsTable from './JobsTable.vue'
import { expect, fn, userEvent } from '@storybook/test'
const meta: Meta<typeof JobsTable> = {
  component: JobsTable,
}

export default meta
type Story = StoryObj<typeof JobsTable>

export const Default: Story = {
  args: {
    'onDelete:job': fn(),
    showDelete: true,
    jobs: [
      {
        jobID: 'a',
        jobStatus: 'INIT',
        key: 'A',
        name: 'My first job',
        started: '2002-02-02T02:02:02Z',
        updated: '2002-02-02T02:08:08Z',
      },
      {
        jobID: 'b',
        jobStatus: 'ERROR',
        key: 'B',
        name: 'xxx',
        started: '2001-01-01T02:02:02Z',
        updated: '2001-01-01T02:08:08Z',
      },
      {
        jobID: 'c',
        jobStatus: 'RUNNING',
        key: 'C',
        name: 'yyy',
        started: '2006-06-06T02:02:02Z',
        updated: '2006-07-07T02:08:08Z',
      },
      {
        jobID: 'd',
        jobStatus: 'SUCCESSFUL',
        key: 'D',
        name: 'good genome',
        started: '2006-06-06T02:02:02Z',
        updated: '2006-07-07T02:08:08Z',
      },
      {
        jobID: 'e',
        jobStatus: 'UNAUTHORIZED',
        key: 'E',
      },
      {
        jobID: 'F',
        jobStatus: 'NOT_FOUND',
        key: 'F',
      },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const del = canvasElement.querySelector('tbody > tr  button') as HTMLButtonElement
    await userEvent.click(del)
    expect(args['onDelete:job']).toHaveBeenLastCalledWith('a')
  },
}
