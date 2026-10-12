import {
  bpScale,
  formatBp as formatBpScale,
} from '@/components/bakta-result/feature-plot/circluar-plot/formatters'
import { formatWorkflowKind, WorkflowKinds, type WorkflowKind } from '@/model/job'
import type { AnyStatus } from '@/model/status-style'
import { StageStatuses, type StageStatus } from '@/model/submit'
import type { Interval } from './admin-api'

/*
 * Formatting and time helpers of the admin pages.
 */

const missing = '-'

export function formatOrigin(origin: string | null | undefined): string {
  if (origin == null) return missing
  return origin === 'Unknown' ? 'Unknown (API or CLI)' : origin
}

export function formatCount(n: number | null | undefined): string {
  if (n == undefined) return missing
  return new Intl.NumberFormat('en-GB').format(n)
}

export function formatBp(n: number | null | undefined): string {
  if (n == undefined) return missing
  return formatBpScale(n, bpScale(n))
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate == undefined) return missing
  return new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 }).format(rate)
}

/**
 * Short durations like "45 s", "6 min 40 s", "2 h 5 min" or "3 d 4 h".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == undefined) return missing
  const s = Math.round(seconds)
  if (s < 60) return `${s} s`
  const minutes = Math.floor(s / 60)
  if (minutes < 60) return s % 60 ? `${minutes} min ${s % 60} s` : `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return missing
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  )
}

/**
 * The label of a time series bucket. Buckets are in UTC like on the server.
 */
export function formatPeriod(date: Date, interval: Interval): string {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' }
  switch (interval) {
    case 'day':
    case 'week':
      Object.assign(options, { day: 'numeric', month: 'short', year: 'numeric' })
      break
    case 'month':
      Object.assign(options, { month: 'short', year: 'numeric' })
      break
    case 'year':
      Object.assign(options, { year: 'numeric' })
      break
  }
  const label = new Intl.DateTimeFormat('en-GB', options).format(date)
  return interval === 'week' ? `Week of ${label}` : label
}

/**
 * The days of a time series bucket, like "5 Oct to 11 Oct 2026", for tooltips.
 * A day bucket is the day itself.
 */
export function periodRange(date: Date, interval: Interval): string {
  const day = (d: Date, year: boolean) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: year ? 'numeric' : undefined,
    }).format(d)
  if (interval === 'day') return day(date, true)
  const last = new Date(nextPeriod(date, interval).getTime() - 86_400_000)
  const sameYear = last.getUTCFullYear() === date.getUTCFullYear()
  return `${day(date, !sameYear)} to ${day(last, true)}`
}

/**
 * The start of the bucket a date falls into, like date_trunc in Postgres (UTC, weeks start on Monday).
 */
export function truncDate(date: Date, interval: Interval): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  switch (interval) {
    case 'day':
      return new Date(Date.UTC(y, m, d))
    case 'week': {
      const monday = d - ((date.getUTCDay() + 6) % 7)
      return new Date(Date.UTC(y, m, monday))
    }
    case 'month':
      return new Date(Date.UTC(y, m, 1))
    case 'year':
      return new Date(Date.UTC(y, 0, 1))
  }
}

export function nextPeriod(date: Date, interval: Interval): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  switch (interval) {
    case 'day':
      return new Date(Date.UTC(y, m, d + 1))
    case 'week':
      return new Date(Date.UTC(y, m, d + 7))
    case 'month':
      return new Date(Date.UTC(y, m + 1, 1))
    case 'year':
      return new Date(Date.UTC(y + 1, 0, 1))
  }
}

/**
 * All bucket starts from the bucket of `from` up to the bucket of `to`, so gaps show as zero.
 */
export function periods(from: Date, to: Date, interval: Interval): Date[] {
  const out: Date[] = []
  const end = truncDate(to, interval).getTime()
  for (let p = truncDate(from, interval); p.getTime() <= end; p = nextPeriod(p, interval)) {
    out.push(p)
  }
  return out
}

/**
 * Continuous percentile of sorted values, like percentile_cont in Postgres.
 */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const pos = (sorted.length - 1) * p
  const lower = Math.floor(pos)
  const upper = Math.ceil(pos)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower)
}

/**
 * The badge status of an Argo phase like "Running" or "Failed".
 */
export function phaseStatus(phase: string | null | undefined): AnyStatus {
  const status = (phase ?? '').toLowerCase()
  return (StageStatuses as readonly string[]).includes(status) ? (status as StageStatus) : 'unknown'
}

/**
 * The input options of a job as readable label and value pairs.
 */
export function configEntries(config: Record<string, unknown>): { label: string; value: string }[] {
  return Object.entries(config).map(([key, value]) => {
    const words = key.replace(/_/g, ' ')
    const label = words.charAt(0).toUpperCase() + words.slice(1)
    let text: string
    if (value == null || value === '') text = missing
    else if (typeof value === 'boolean') text = value ? 'Yes' : 'No'
    else if (typeof value === 'object') text = JSON.stringify(value)
    else text = String(value)
    return { label, value: text }
  })
}

type RangeLabels = { label: string; tick: string }

/**
 * Readable labels of a bucket from min up to max, with a long label for the
 * tooltip ("2 to 5 min") and a short one for the axis ("2-5 min"). A bucket
 * from 0 reads "Under ...", a bucket without max "... and more". part splits a
 * value into number and unit.
 */
function rangeLabels(
  min: number,
  max: number | null | undefined,
  part: (value: number) => [string, string],
): RangeLabels {
  const text = (value: number) => part(value).join(' ')
  if (max == null) return { label: `${text(min)} and more`, tick: `≥ ${text(min)}` }
  if (min === 0) return { label: `Under ${text(max)}`, tick: `< ${text(max)}` }
  const [from, fromUnit] = part(min)
  const [to, toUnit] = part(max)
  if (fromUnit === toUnit) {
    return { label: `${from} to ${to} ${toUnit}`, tick: `${from}-${to} ${toUnit}` }
  }
  return { label: `${text(min)} to ${text(max)}`, tick: `${text(min)}-${text(max)}` }
}

const round = (value: number) => String(Math.round(value * 10) / 10)

export function secondsRange(min: number, max: number | null | undefined): RangeLabels {
  return rangeLabels(min, max, (s) => (s < 3600 ? [round(s / 60), 'min'] : [round(s / 3600), 'h']))
}

export function bpRange(min: number, max: number | null | undefined): RangeLabels {
  return rangeLabels(min, max, (bp) => [round(bp / 1e6), 'Mbp'])
}

export function isWorkflowKind(kind: string | null | undefined): kind is WorkflowKind {
  return (WorkflowKinds as readonly string[]).includes(kind ?? '')
}

/**
 * The name of a workflow kind, unknown kinds as they are.
 */
export function kindLabel(kind: string): string {
  return isWorkflowKind(kind) ? formatWorkflowKind(kind) : kind
}

/**
 * The final result of a deleted or expired job, like "outcome: succeeded".
 * Other jobs show their result in the status already.
 */
export function outcomeText(job: { status: string; outcome?: string | null }): string {
  if (!job.outcome || (job.status !== 'deleted' && job.status !== 'expired')) return ''
  return `outcome: ${job.outcome}`
}

export function sequenceRange(min: number, max: number | null | undefined): RangeLabels {
  const unit = (n: number) => (n === 1 ? 'sequence' : 'sequences')
  if (max == null) return { label: `${min} and more sequences`, tick: `≥ ${min}` }
  if (min === max) return { label: `${min} ${unit(min)}`, tick: String(min) }
  return { label: `${min} to ${max} sequences`, tick: `${min}-${max}` }
}

/**
 * The success rate like the headline rate: succeeded of the finished jobs,
 * none when nothing finished or the server does not send the finished jobs.
 */
export function successRate(row: {
  jobs_succeeded: number
  jobs_finished?: number | null
}): number | null {
  return row.jobs_finished ? row.jobs_succeeded / row.jobs_finished : null
}

// the Argo phase that matches a job status
const statusPhase: Record<string, string> = {
  created: 'Pending',
  submitted: 'Pending',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  error: 'Error',
}

/**
 * A short note when the Argo workflow tells something else than the job
 * status, like "Argo: Failed", or "Argo: gone" when an active job has no
 * workflow. Empty when both agree.
 */
export function argoNote(status: string, phase: string | null | undefined): string {
  if (!phase) return status === 'submitted' || status === 'running' ? 'Argo: gone' : ''
  return statusPhase[status] === phase ? '' : `Argo: ${phase}`
}

/**
 * The change against an earlier value, like "+12% vs previous 30 days". Rates
 * change in percentage points. Empty when there is nothing to compare with.
 */
export function changeText(
  value: number | null | undefined,
  previous: number | null | undefined,
  period: string,
  rate = false,
): string {
  if (value == null || previous == null) return ''
  let change: number
  if (rate) change = (value - previous) * 100
  else if (previous === 0) return ''
  else change = ((value - previous) / previous) * 100
  const rounded = Math.round(change * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '±'
  const unit = rate ? ' points' : '%'
  return `${sign}${new Intl.NumberFormat('en-GB').format(Math.abs(rounded))}${unit} vs ${period}`
}
