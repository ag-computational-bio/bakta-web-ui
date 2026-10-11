import { formatWorkflowKind, WorkflowKinds } from '@/model/job'
import { reactive } from 'vue'
import type { Environment, Interval, StatsFilter } from './admin-api'

/*
 * Environment and time range of the admin pages. They are shared, so the
 * overview and the job list show the same jobs.
 */

export type TimeRange = '30d' | '12m' | 'all' | 'custom'

export const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
]

export const environments: { value: Environment; label: string }[] = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'all', label: 'All environments' },
]

// the workflow kind filter of the statistics tabs, '' stands for all kinds
export const kindFilterOptions = [
  { value: '', label: 'All workflows' },
  ...WorkflowKinds.map((value) => ({ value, label: formatWorkflowKind(value) })),
]

export const filters = reactive({
  environment: 'production' as Environment,
  range: '30d' as TimeRange,
  // dates of the custom range as yyyy-mm-dd, both days included
  customFrom: '',
  customTo: '',
})

/**
 * The query parameters of the current filters. "now" is a parameter for the tests.
 */
export function statsFilter(now = new Date()): StatsFilter {
  const filter: StatsFilter = { environment: filters.environment }
  switch (filters.range) {
    case '30d':
      filter.from = new Date(now.getTime() - 30 * 86_400_000).toISOString()
      break
    case '12m': {
      const from = new Date(now)
      from.setUTCFullYear(from.getUTCFullYear() - 1)
      filter.from = from.toISOString()
      break
    }
    case 'custom':
      if (filters.customFrom) filter.from = `${filters.customFrom}T00:00:00Z`
      // the server excludes "to", so the range ends at the start of the next day
      if (filters.customTo) {
        const to = new Date(`${filters.customTo}T00:00:00Z`)
        to.setUTCDate(to.getUTCDate() + 1)
        filter.to = to.toISOString()
      }
      break
  }
  return filter
}

export const intervalOptions: { value: Interval; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

/**
 * A matching interval for the time range, so a chart has a useful number of bars.
 */
export function defaultInterval(range: TimeRange): Interval {
  return range === '30d' ? 'day' : range === '12m' ? 'week' : 'month'
}
