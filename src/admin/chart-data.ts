import type { Bucket, Interval, StatsFilter } from './admin-api'
import { periods } from './format'

type BucketField =
  | 'jobs_total'
  | 'jobs_succeeded'
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
  const empty = field === 'jobs_total' || field === 'jobs_succeeded' ? 0 : null
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
 * The counts of a chart as tab separated text: a row per period with a column
 * per series and the total. Periods are named by their start in UTC, like
 * 2026-10-05 for a day or a week and 2026-10 for a month.
 */
export function chartTsv(
  chartPeriods: Date[],
  interval: Interval,
  series: { key: string; label: string }[],
  values: Record<string, (number | null)[]>,
): string {
  const length = interval === 'year' ? 4 : interval === 'month' ? 7 : 10
  const rows = chartPeriods.map((period, i) => {
    const counts = series.map((s) => values[s.key]?.[i] ?? 0)
    return [period.toISOString().slice(0, length), ...counts, counts.reduce((a, b) => a + b, 0)]
  })
  return [[interval, ...series.map((s) => s.label), 'Total'], ...rows]
    .map((row) => row.join('\t') + '\n')
    .join('')
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
