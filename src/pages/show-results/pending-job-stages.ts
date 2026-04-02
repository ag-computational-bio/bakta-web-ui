import type { WorkflowKind } from '@/model/job'
import type { JobStatus, StageLog, WorkflowDescriptor } from '@/model/submit'

function fallbackWorkflowStages(workflowKind: WorkflowKind | undefined): string[] {
  switch (workflowKind) {
    case 'bakta':
      return ['bakta']
    case 'bakta_baktfold':
      return ['bakta', 'baktfold']
    case 'bakta_proteins':
      return ['bakta_proteins']
    case 'baktfold':
      return ['baktfold']
    default:
      return []
  }
}

function workflowStages(
  workflowKind: WorkflowKind | undefined,
  descriptors: WorkflowDescriptor[],
): string[] {
  if (!workflowKind) return []

  return (
    descriptors.find((workflow) => workflow.workflowKind === workflowKind)?.stages ??
    fallbackWorkflowStages(workflowKind)
  )
}

function markActiveStage(stages: StageLog[], jobStatus: JobStatus | undefined): StageLog[] {
  if (jobStatus !== 'RUNNING') return stages
  if (stages.some((stage) => stage.status === 'running')) return stages

  const activeIndex = stages.findIndex(
    (stage) => stage.status === 'pending' || stage.status === 'unknown',
  )
  if (activeIndex < 0) return stages

  return stages.map((stage, idx) => (idx === activeIndex ? { ...stage, status: 'running' } : stage))
}

export function buildPendingWorkflowStages(
  workflowKind: WorkflowKind | undefined,
  descriptors: WorkflowDescriptor[],
  stageLogs: StageLog[],
  jobStatus: JobStatus | undefined,
): StageLog[] {
  const configuredStages = workflowStages(workflowKind, descriptors)
  const stageLogsByStage = new Map(stageLogs.map((stage) => [stage.stage, stage]))

  const normalizedStages =
    configuredStages.length > 0
      ? configuredStages.map(
          (stage): StageLog =>
            stageLogsByStage.get(stage) ?? {
              stage,
              status: 'pending',
              content: '',
            },
        )
      : [...stageLogs]

  if (configuredStages.length > 0) {
    for (const stageLog of stageLogs) {
      if (!configuredStages.includes(stageLog.stage)) normalizedStages.push(stageLog)
    }
  }

  return markActiveStage(normalizedStages, jobStatus)
}
