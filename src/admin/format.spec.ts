import { describe, expect, it } from 'vitest'
import {
  bpRange,
  configEntries,
  formatDuration,
  formatPercent,
  outcomeText,
  percentile,
  periods,
  phaseStatus,
  secondsRange,
  truncDate,
} from './format'

describe('formatDuration', () => {
  it('uses short units', () => {
    expect(formatDuration(45.4)).toBe('45 s')
    expect(formatDuration(400)).toBe('6 min 40 s')
    expect(formatDuration(7500)).toBe('2 h 5 min')
    expect(formatDuration(3 * 86400 + 4 * 3600)).toBe('3 d 4 h')
    expect(formatDuration(null)).toBe('-')
  })
})

describe('formatPercent', () => {
  it('rounds to one decimal', () => {
    expect(formatPercent(0.9583)).toBe('95.8%')
    expect(formatPercent(undefined)).toBe('-')
  })
})

describe('truncDate', () => {
  const date = new Date('2026-09-17T15:30:00Z') // a Thursday

  it('works like date_trunc in UTC', () => {
    expect(truncDate(date, 'day').toISOString()).toBe('2026-09-17T00:00:00.000Z')
    expect(truncDate(date, 'week').toISOString()).toBe('2026-09-14T00:00:00.000Z')
    expect(truncDate(date, 'month').toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(truncDate(date, 'year').toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('starts weeks on Monday also for Sundays', () => {
    const sunday = new Date('2026-09-20T23:00:00Z')
    expect(truncDate(sunday, 'week').toISOString()).toBe('2026-09-14T00:00:00.000Z')
  })
})

describe('periods', () => {
  it('lists every bucket between two dates', () => {
    const list = periods(
      new Date('2025-11-20T00:00:00Z'),
      new Date('2026-02-03T00:00:00Z'),
      'month',
    )
    expect(list.map((d) => d.toISOString().slice(0, 7))).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
  })
})

describe('percentile', () => {
  it('interpolates like percentile_cont', () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(percentile([10], 0.9)).toBe(10)
    expect(percentile([], 0.5)).toBe(null)
  })
})

describe('configEntries', () => {
  it('shows options as readable text', () => {
    expect(
      configEntries({
        complete_genome: true,
        genus: 'Escherichia',
        locus: null,
        min_contig_length: 1,
      }),
    ).toEqual([
      { label: 'Complete genome', value: 'Yes' },
      { label: 'Genus', value: 'Escherichia' },
      { label: 'Locus', value: '-' },
      { label: 'Min contig length', value: '1' },
    ])
  })
})

describe('phaseStatus', () => {
  it('maps Argo phases to badge statuses', () => {
    expect(phaseStatus('Failed')).toBe('failed')
    expect(phaseStatus('Omitted')).toBe('unknown')
  })
})

describe('bucket ranges', () => {
  it('reads like plain text', () => {
    expect(secondsRange(0, 120)).toEqual({ label: 'Under 2 min', tick: '< 2 min' })
    expect(secondsRange(120, 300)).toEqual({ label: '2 to 5 min', tick: '2-5 min' })
    expect(secondsRange(1800, 3600).label).toBe('30 min to 1 h')
    expect(secondsRange(14400, null)).toEqual({ label: '4 h and more', tick: '≥ 4 h' })
    expect(bpRange(1e6, 2e6).label).toBe('1 to 2 Mbp')
    expect(bpRange(12e6, null).label).toBe('12 Mbp and more')
  })
})

describe('outcomeText', () => {
  it('shows the outcome of deleted and expired jobs only', () => {
    expect(outcomeText({ status: 'expired', outcome: 'succeeded' })).toBe('outcome: succeeded')
    expect(outcomeText({ status: 'failed', outcome: 'failed' })).toBe('')
    expect(outcomeText({ status: 'deleted', outcome: null })).toBe('')
  })
})
