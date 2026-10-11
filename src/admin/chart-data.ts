import type { Bucket, Interval, StatsFilter } from './admin-api'
import { periods } from './format'

type BucketField =
  | 'jobs_total'
  | 'runtime_p50'
  | 'runtime_p90'
  | 'runtime_avg'
  | 'input_p50_bp'
  | 'input_avg_bp'

/**
 * The periods of a chart: from the start of the time range, or the first bucket
 * for all time, up to the end of the range or today.
 */
export function chartPeriods(
  buckets: Bucket[],
  filter: StatsFilter,
  interval: Interval,
  now = new Date(),
): Date[] {
  const first = buckets.reduce<string | undefined>(
    (min, b) => (min == undefined || b.period_start < min ? b.period_start : min),
    undefined,
  )
  const from = filter.from ?? first
  if (from == undefined) return []
  // the server excludes "to", the periods include their end, so the end is the moment before "to"
  const end = filter.to ? new Date(Date.parse(filter.to) - 1) : now
  return periods(new Date(from), end < now ? end : now, interval)
}

/**
 * The values of one field per group and period. The server leaves out empty
 * buckets: counts become 0 there, durations null (no point in the line).
 */
export function bucketValues(
  buckets: Bucket[],
  chartPeriods: Date[],
  field: BucketField,
): Record<string, (number | null)[]> {
  const index = new Map(chartPeriods.map((p, i) => [p.getTime(), i]))
  const empty = field === 'jobs_total' ? 0 : null
  const values: Record<string, (number | null)[]> = {}
  for (const bucket of buckets) {
    const i = index.get(new Date(bucket.period_start).getTime())
    if (i == undefined) continue
    const group = bucket.group ?? ''
    values[group] ??= chartPeriods.map(() => empty)
    values[group][i] = bucket[field] ?? null
  }
  return values
}

/**
 * The indexes that get a point in a line chart. With few periods every value
 * gets one, with many only the values without a neighbour, which the line
 * cannot show.
 */
export function pointIndexes(values: (number | null | undefined)[], every: boolean): number[] {
  const has = (i: number) => values[i] != null
  return values.map((_, i) => i).filter((i) => has(i) && (every || (!has(i - 1) && !has(i + 1))))
}
