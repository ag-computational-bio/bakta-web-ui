/*
 * The actions on single workflows: which apply to a phase, and the texts of
 * their confirmation.
 */

export type WorkflowAction = 'retry' | 'stop' | 'resume' | 'delete'

export const actionLabels: Record<WorkflowAction, string> = {
  retry: 'Retry',
  stop: 'Stop',
  resume: 'Resume',
  delete: 'Delete',
}

export const actionIcons: Record<WorkflowAction, string> = {
  retry: 'bi-arrow-repeat',
  stop: 'bi-stop-circle',
  resume: 'bi-play-circle',
  delete: 'bi-trash',
}

export const actionTexts: Record<WorkflowAction, { title: string; text: string; danger: boolean }> =
  {
    retry: {
      title: 'Retry the workflow?',
      text: 'Argo runs the failed steps again.',
      danger: false,
    },
    stop: { title: 'Stop the workflow?', text: 'Argo terminates the workflow.', danger: true },
    resume: {
      title: 'Resume the workflow?',
      text: 'Argo continues the suspended workflow.',
      danger: false,
    },
    delete: {
      title: 'Delete the workflow?',
      text: 'The workflow and its pods are deleted and the job is marked as deleted. The S3 data is kept.',
      danger: true,
    },
  }

/**
 * The actions for a live workflow phase. Delete is always possible, retry
 * needs the input data, which is deleted after the retention period.
 */
export function workflowActions(
  phase: string | null | undefined,
  suspended = false,
  dataAvailable = true,
): WorkflowAction[] {
  const actions: WorkflowAction[] = []
  if ((phase === 'Failed' || phase === 'Error') && dataAvailable) actions.push('retry')
  if (suspended) actions.push('resume')
  if (phase === 'Pending' || phase === 'Running') actions.push('stop')
  actions.push('delete')
  return actions
}
