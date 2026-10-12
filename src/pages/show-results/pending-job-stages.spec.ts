import type { WorkflowDescriptor } from '@/model/submit'
import { describe, expect, it } from 'vitest'
import { buildPendingWorkflowStages } from './pending-job-stages'

const workflows: WorkflowDescriptor[] = [
  {
    workflowKind: 'bakta_baktfold',
    resultKind: 'baktfold',
    uploads: [],
    stages: ['bakta', 'baktfold'],
  },
  {
    workflowKind: 'bakta_proteins',
    resultKind: 'bakta_proteins',
    uploads: [],
    stages: ['bakta_proteins'],
  },
]

describe('buildPendingWorkflowStages', () => {
  it('uses configured workflow stages when logs are not available yet', () => {
    expect(buildPendingWorkflowStages('bakta_proteins', workflows, [], 'RUNNING')).toEqual([
      {
        stage: 'bakta_proteins',
        status: 'running',
        content: '',
      },
    ])
  })

  it('marks the next unresolved stage as running for combined workflows', () => {
    expect(
      buildPendingWorkflowStages(
        'bakta_baktfold',
        workflows,
        [
          {
            stage: 'bakta',
            status: 'succeeded',
            content: 'done',
          },
        ],
        'RUNNING',
      ),
    ).toEqual([
      {
        stage: 'bakta',
        status: 'succeeded',
        content: 'done',
      },
      {
        stage: 'baktfold',
        status: 'running',
        content: '',
      },
    ])
  })

  it('falls back to workflow defaults when descriptors are unavailable', () => {
    expect(buildPendingWorkflowStages('baktfold', [], [], 'INIT')).toEqual([
      {
        stage: 'baktfold',
        status: 'pending',
        content: '',
      },
    ])
  })
})
