import { describe, expect, it } from 'vitest'
import { jobActionTitle, workflowActions } from './workflow-actions'

describe('workflowActions', () => {
  it('offers retry for failed workflows only while the data exists', () => {
    expect(workflowActions('Failed')).toEqual(['retry', 'delete'])
    expect(workflowActions('Error', false, false)).toEqual(['delete'])
    expect(workflowActions('Running', true)).toEqual(['resume', 'stop', 'delete'])
  })
})

describe('jobActionTitle', () => {
  it('names the job and its organism', () => {
    expect(jobActionTitle('Stop', 'e675834b-77f8', 'Escherichia coli K-12')).toBe(
      'Stop job e675834b (Escherichia coli K-12)?',
    )
    expect(jobActionTitle('Delete', 'e675834b-77f8', null)).toBe('Delete job e675834b?')
  })
})
