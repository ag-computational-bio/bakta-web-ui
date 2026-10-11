import { formatWorkflowKind, type WorkflowKind } from '@/model/job'
import { formatStatus } from '@/model/status-style'
import { AdminJobStatuses, type GroupBy } from './admin-api'

/*
 * Chart colors come from the theme. Bars use the light colors of the status
 * badges with a thin outline in a stronger tone, so stacked segments stay
 * apart. Workflow kinds use the tones of their shields, statuses the tones of
 * their badges: the main state of a tone gets the stronger light color, the
 * second state the lightest one. Lines keep the strong colors.
 */

// color is the fill of a bar or the color of a line, stroke the outline of a bar
export type ChartSeries = { key: string; label: string; color: string; stroke?: string }

type Tone = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary'

// the main light color of a tone, for example for the only state of a tone
export function lightColor(tone: Tone): Pick<ChartSeries, 'color' | 'stroke'> {
  return { color: `var(--bs-${tone}-border-subtle)`, stroke: `var(--bs-${tone})` }
}

// the lightest color of a tone, for the second state of a tone
function lighterColor(tone: Tone): Pick<ChartSeries, 'color' | 'stroke'> {
  return { color: `var(--bs-${tone}-bg-subtle)`, stroke: `var(--bs-${tone}-border-subtle)` }
}

const workflowColors: Record<WorkflowKind, Pick<ChartSeries, 'color' | 'stroke'>> = {
  bakta: lightColor('success'),
  bakta_baktfold: lightColor('primary'),
  bakta_proteins: lightColor('info'),
  baktfold: lightColor('warning'),
}

const statusColors: Record<
  (typeof AdminJobStatuses)[number],
  Pick<ChartSeries, 'color' | 'stroke'>
> = {
  succeeded: lightColor('success'),
  running: lighterColor('success'),
  submitted: lightColor('warning'),
  created: lighterColor('warning'),
  failed: lightColor('danger'),
  error: lighterColor('danger'),
  deleted: lightColor('secondary'),
  expired: lighterColor('secondary'),
}

const otherColor = { color: 'var(--bs-tertiary-bg)', stroke: 'var(--bs-secondary-color)' }

/**
 * The series of a grouping in a fixed order, so a color always belongs to the same group.
 */
export function groupSeries(groupBy: GroupBy, groups: string[]): ChartSeries[] {
  let known: ChartSeries[] = []
  if (groupBy === 'workflow_kind') {
    known = Object.entries(workflowColors).map(([key, colors]) => ({
      key,
      ...colors,
      label: formatWorkflowKind(key as WorkflowKind),
    }))
  } else if (groupBy === 'status') {
    known = Object.entries(statusColors).map(([key, colors]) => ({
      key,
      ...colors,
      label: formatStatus(key as keyof typeof statusColors),
    }))
  } else if (groupBy === 'none') {
    known = [{ key: '', label: 'Jobs', ...lightColor('primary') }]
  }
  const others = groups
    .filter((g) => !known.some((s) => s.key === g))
    .map((key) => ({ key, label: key || 'Unknown', ...otherColor }))
  return [...known.filter((s) => groups.includes(s.key)), ...others]
}
