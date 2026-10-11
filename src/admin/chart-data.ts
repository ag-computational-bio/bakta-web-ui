import type { Bucket, Interval, StatsFilter } from './admin-api'
import { periods } from './format'

type BucketField = 'jobs_total' | 'runtime_p50' | 'runtime_p90' | 'runtime_avg'

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
  const to = filter.to && new Date(filter.to) < now ? new Date(filter.to) : now
  return periods(new Date(from), to, interval)
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
