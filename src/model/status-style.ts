import type { FailedJobStatus, JobStatus, StageStatus } from '@/model/submit'

// job statuses come in upper case from the job list, step statuses in lower case from the logs
export type AnyStatus = JobStatus | FailedJobStatus | StageStatus

type StatusTone = 'warning' | 'success' | 'danger' | 'secondary'

export function statusTone(status: AnyStatus): StatusTone {
  switch (status) {
    case 'INIT':
    case 'pending':
      return 'warning'
    case 'RUNNING':
    case 'running':
    case 'SUCCESSFUL':
    case 'SUCCESSFULL':
    case 'succeeded':
      return 'success'
    case 'ERROR':
    case 'UNAUTHORIZED':
    case 'failed':
    case 'error':
      return 'danger'
    default:
      return 'secondary'
  }
}

export function statusIcon(status: AnyStatus): string {
  switch (status) {
    case 'INIT':
    case 'pending':
      return 'bi-hourglass'
    case 'RUNNING':
    case 'running':
      return 'bi-gear'
    case 'SUCCESSFUL':
    case 'SUCCESSFULL':
    case 'succeeded':
      return 'bi-check-circle-fill'
    case 'NOT_FOUND':
    case 'UNAUTHORIZED':
    case 'ERROR':
    case 'failed':
    case 'error':
      return 'bi-x-circle-fill'
    case 'unknown':
      return 'bi-question-circle'
  }
}

export function formatStatus(status: AnyStatus): string {
  switch (status) {
    case 'NOT_FOUND':
      return 'Outdated'
    case 'SUCCESSFULL':
      return 'Successful'
  }
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
