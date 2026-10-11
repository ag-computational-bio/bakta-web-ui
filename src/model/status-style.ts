import type { FailedJobStatus, JobStatus, StageStatus } from '@/model/submit'

// statuses of the admin job records that the other lists do not have
export type AdminJobStatus = 'created' | 'submitted' | 'deleted' | 'expired'

// job statuses come in upper case from the job list, step statuses in lower case from the logs
export type AnyStatus = JobStatus | FailedJobStatus | StageStatus | AdminJobStatus

type StatusTone = 'warning' | 'success' | 'danger' | 'secondary'

export function statusTone(status: AnyStatus): StatusTone {
  switch (status) {
    case 'INIT':
    case 'pending':
    case 'created':
    case 'submitted':
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

// active and waiting states use strong colors, finished states light ones
export function isActiveStatus(status: AnyStatus): boolean {
  return (
    status === 'INIT' ||
    status === 'pending' ||
    status === 'created' ||
    status === 'submitted' ||
    status === 'RUNNING' ||
    status === 'running'
  )
}

export function statusIcon(status: AnyStatus): string {
  switch (status) {
    case 'INIT':
    case 'pending':
    case 'created':
    case 'submitted':
      return 'bi-hourglass'
    case 'RUNNING':
    case 'running':
      return 'bi-gear'
    case 'SUCCESSFUL':
    case 'SUCCESSFULL':
    case 'succeeded':
      return 'bi-check-circle'
    case 'NOT_FOUND':
    case 'UNAUTHORIZED':
    case 'ERROR':
    case 'failed':
    case 'error':
      return 'bi-x-circle'
    case 'deleted':
      return 'bi-trash'
    case 'expired':
      return 'bi-clock-history'
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
