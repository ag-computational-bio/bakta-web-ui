import { describe, expect, it } from 'vitest'
import { workflowActions } from './workflow-actions'

describe('workflowActions', () => {
  it('offers retry for failed workflows only while the data exists', () => {
    expect(workflowActions('Failed')).toEqual(['retry', 'delete'])
    expect(workflowActions('Error', false, false)).toEqual(['delete'])
    expect(workflowActions('Running', true)).toEqual(['resume', 'stop', 'delete'])
  })
})
