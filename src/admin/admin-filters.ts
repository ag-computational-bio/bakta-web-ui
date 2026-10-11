import { reactive } from 'vue'
import type { Environment, StatsFilter } from './admin-api'

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
  { value: 'all', label: 'All' },
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
      if (filters.customTo) filter.to = `${filters.customTo}T23:59:59Z`
      break
  }
  return filter
}
