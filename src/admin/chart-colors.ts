import { formatWorkflowKind, type WorkflowKind } from '@/model/job'
import { formatStatus } from '@/model/status-style'
import { AdminJobStatuses, type GroupBy } from './admin-api'

/*
 * Chart colors come from the theme. Workflow kinds use the colors of their
 * shields, statuses the colors of their badges: the strong color for the
 * main state of a tone, the lighter border color for the second one.
 */

export type ChartSeries = { key: string; label: string; color: string }

const workflowColors: Record<WorkflowKind, string> = {
  bakta: 'var(--bs-success)',
  bakta_baktfold: 'var(--bs-primary)',
  bakta_proteins: 'var(--bs-info)',
  baktfold: 'var(--bs-warning)',
}

const statusColors: Record<(typeof AdminJobStatuses)[number], string> = {
  succeeded: 'var(--bs-success)',
  running: 'var(--bs-success-border-subtle)',
  submitted: 'var(--bs-warning)',
  created: 'var(--bs-warning-border-subtle)',
  failed: 'var(--bs-danger)',
  error: 'var(--bs-danger-border-subtle)',
  deleted: 'var(--bs-secondary)',
  expired: 'var(--bs-secondary-border-subtle)',
}

const otherColor = 'var(--bs-secondary-color)'

/**
 * The series of a grouping in a fixed order, so a color always belongs to the same group.
 */
export function groupSeries(groupBy: GroupBy, groups: string[]): ChartSeries[] {
  let known: ChartSeries[] = []
  if (groupBy === 'workflow_kind') {
    known = Object.entries(workflowColors).map(([key, color]) => ({
      key,
      color,
      label: formatWorkflowKind(key as WorkflowKind),
    }))
  } else if (groupBy === 'status') {
    known = Object.entries(statusColors).map(([key, color]) => ({
      key,
      color,
      label: formatStatus(key as keyof typeof statusColors),
    }))
  } else if (groupBy === 'none') {
    known = [{ key: '', label: 'Jobs', color: 'var(--bs-primary)' }]
  }
  const others = groups
    .filter((g) => !known.some((s) => s.key === g))
    .map((key) => ({ key, label: key || 'Unknown', color: otherColor }))
  return [...known.filter((s) => groups.includes(s.key)), ...others]
}
