import { formatWorkflowKind, WorkflowKinds } from '@/model/job'
import { reactive } from 'vue'
import type { Environment, Interval, StatsFilter } from './admin-api'

/*
 * Environment and time range of the admin pages. They are shared, so the
 * overview and the job list show the same jobs.
 */

export type TimeRange = '7d' | '30d' | '90d' | '12m' | 'all' | 'custom'

export const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
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

const day = 86_400_000

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
  const from = rangeStart(filters.range, now)
  if (from) filter.from = from.toISOString()
  if (filters.range === 'custom') {
    if (filters.customFrom) filter.from = `${filters.customFrom}T00:00:00Z`
    // the server excludes "to", so the range ends at the start of the next day
    if (filters.customTo) {
      const to = new Date(`${filters.customTo}T00:00:00Z`)
      to.setUTCDate(to.getUTCDate() + 1)
      filter.to = to.toISOString()
    }
  }
  return filter
}

/**
 * The period of the same length right before the filter, for a comparison.
 * None for a range without a start, like all time.
 */
export function previousFilter(filter: StatsFilter, now = new Date()): StatsFilter | undefined {
  if (!filter.from) return undefined
  const from = Date.parse(filter.from)
  const to = filter.to ? Date.parse(filter.to) : now.getTime()
  return {
    environment: filter.environment,
    from: new Date(from - (to - from)).toISOString(),
    to: new Date(from).toISOString(),
  }
}

/**
 * The name of the period before a time range, like "previous 30 days".
 */
export function previousLabel(range: TimeRange): string {
  const label = timeRanges.find((r) => r.value === range)?.label ?? ''
  return range === 'custom' || range === 'all'
    ? 'previous period'
    : label.replace('Last', 'previous')
}

/**
 * The start of a preset time range, none for all time and a custom range.
 */
function rangeStart(range: TimeRange, now: Date): Date | undefined {
  switch (range) {
    case '7d':
    case '30d':
    case '90d':
      return new Date(now.getTime() - parseInt(range) * day)
    case '12m': {
      const from = new Date(now)
      from.setUTCFullYear(from.getUTCFullYear() - 1)
      return from
    }
  }
  return undefined
}

/**
 * A short text with the dates of a time range, for the time range menu.
 */
export function rangeDescription(range: TimeRange, now = new Date()): string {
  if (range === 'all') return 'Every job'
  if (range === 'custom') return 'Pick a start and end date'
  const format = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })
  return `${format.format(rangeStart(range, now))} to today`
}

/**
 * The time range in the URL: only the range, and the dates for a custom range.
 */
export function filterQuery(): Record<string, string | undefined> {
  const custom = filters.range === 'custom'
  return {
    range: filters.range === '30d' ? undefined : filters.range,
    from: (custom && filters.customFrom) || undefined,
    to: (custom && filters.customTo) || undefined,
  }
}

/**
 * Takes the time range from the URL.
 */
export function readFilterQuery(query: Record<string, unknown>) {
  // without a range in the URL the default range applies, like in filterQuery
  filters.range = timeRanges.find((r) => r.value === query.range)?.value ?? '30d'
  if (filters.range === 'custom') {
    const from = query.from == undefined ? '' : calendarDate(query.from)
    const to = query.to == undefined ? '' : calendarDate(query.to)
    // a broken date would break the statistics requests, so the default range is used
    if (from == undefined || to == undefined) {
      Object.assign(filters, { range: '30d', customFrom: '', customTo: '' })
      return
    }
    filters.customFrom = from
    filters.customTo = to
  }
}

/**
 * The value when it is a real day as yyyy-mm-dd, like 2026-02-28 but not 2026-02-30.
 */
function calendarDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : undefined
}

/**
 * The chart interval for a time range, so a chart has a useful number of bars.
 * A range without a start (all time, or a custom range without a "from" date)
 * uses the first data point as start, when it is known.
 */
export function chartInterval(
  range: TimeRange,
  filter: Pick<StatsFilter, 'from' | 'to'>,
  now = new Date(),
  dataStart?: string,
): Interval {
  switch (range) {
    case '7d':
    case '30d':
      return 'day'
    case '90d':
      return 'week'
    case '12m':
      return 'month'
  }
  const start = filter.from ?? dataStart
  const end = filter.to ? Math.min(Date.parse(filter.to), now.getTime()) : now.getTime()
  const days = start == undefined ? undefined : (end - Date.parse(start)) / day
  const years = 3 * 365 + 1
  if (range === 'all' || days == undefined) {
    return days != undefined && days > years ? 'year' : 'month'
  }
  return days <= 45 ? 'day' : days <= 200 ? 'week' : days <= years ? 'month' : 'year'
}

/**
 * Loads the chart data with the interval of the current time range. Without a
 * start of the range, the first answer tells where the data starts, and a
 * different interval for that span loads the data again.
 */
export async function loadChart<T>(
  load: (interval: Interval) => Promise<T>,
  firstPeriod: (data: T) => string | undefined,
): Promise<{ interval: Interval; data: T }> {
  const filter = statsFilter()
  const interval = chartInterval(filters.range, filter)
  const data = await load(interval)
  if (filter.from) return { interval, data }
  const better = chartInterval(filters.range, filter, new Date(), firstPeriod(data))
  return better === interval ? { interval, data } : { interval: better, data: await load(better) }
}

/**
 * The first bucket start of a time series.
 */
export function firstBucket(buckets: { period_start: string }[]): string | undefined {
  return buckets.reduce<string | undefined>(
    (min, b) => (min == undefined || b.period_start < min ? b.period_start : min),
    undefined,
  )
}

/**
 * The note in a chart header, like "per week".
 */
export function intervalNote(interval: Interval): string {
  return `per ${interval}`
}
