import {
  bpScale,
  formatBp as formatBpScale,
} from '@/components/bakta-result/feature-plot/circluar-plot/formatters'
import type { Interval } from './admin-api'

/*
 * Formatting and time helpers of the admin pages.
 */

const missing = '-'

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
