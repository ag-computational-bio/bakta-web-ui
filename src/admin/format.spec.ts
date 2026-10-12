import { describe, expect, it } from 'vitest'
import {
  argoNote,
  bpRange,
  changeText,
  configEntries,
  formatDuration,
  formatOrigin,
  formatPercent,
  outcomeText,
  percentile,
  periodRange,
  successRate,
  periods,
  phaseStatus,
  secondsRange,
  sequenceRange,
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
    expect(sequenceRange(1, 1)).toEqual({ label: '1 sequence', tick: '1' })
    expect(sequenceRange(2, 5).label).toBe('2 to 5 sequences')
    expect(sequenceRange(2001, null).tick).toBe('≥ 2001')
  })
})

describe('outcomeText', () => {
  it('shows the outcome of deleted and expired jobs only', () => {
    expect(outcomeText({ status: 'expired', outcome: 'succeeded' })).toBe('outcome: succeeded')
    expect(outcomeText({ status: 'failed', outcome: 'failed' })).toBe('')
    expect(outcomeText({ status: 'deleted', outcome: null })).toBe('')
  })
})

describe('successRate', () => {
  it('divides the succeeded by the finished jobs', () => {
    expect(successRate({ jobs_succeeded: 3, jobs_finished: 4 })).toBe(0.75)
    expect(successRate({ jobs_succeeded: 0, jobs_finished: 0 })).toBeNull()
    expect(successRate({ jobs_succeeded: 3 })).toBeNull()
  })
})

describe('argoNote', () => {
  it('only tells when Argo differs from the job status', () => {
    expect(argoNote('running', 'Running')).toBe('')
    expect(argoNote('submitted', 'Pending')).toBe('')
    expect(argoNote('running', 'Failed')).toBe('Argo: Failed')
    expect(argoNote('deleted', 'Succeeded')).toBe('Argo: Succeeded')
    expect(argoNote('running', null)).toBe('Argo: gone')
    expect(argoNote('succeeded', null)).toBe('')
  })
})

describe('changeText', () => {
  it('compares with the previous period', () => {
    expect(changeText(112, 100, 'previous 30 days')).toBe('+12% vs previous 30 days')
    expect(changeText(90, 100, 'previous 7 days')).toBe('-10% vs previous 7 days')
    expect(changeText(5, 5, 'previous period')).toBe('±0% vs previous period')
    expect(changeText(0.95, 0.9, 'previous 30 days', true)).toBe('+5 points vs previous 30 days')
    expect(changeText(3, 0, 'previous 30 days')).toBe('')
    expect(changeText(3, undefined, 'previous 30 days')).toBe('')
  })
})

describe('periodRange', () => {
  it('names the days of a bucket', () => {
    const utc = (d: string) => new Date(`${d}T00:00:00Z`)
    expect(periodRange(utc('2026-10-11'), 'day')).toBe('11 Oct 2026')
    expect(periodRange(utc('2026-10-05'), 'week')).toBe('5 Oct to 11 Oct 2026')
    expect(periodRange(utc('2025-12-29'), 'week')).toBe('29 Dec 2025 to 4 Jan 2026')
    expect(periodRange(utc('2026-02-01'), 'month')).toBe('1 Feb to 28 Feb 2026')
    expect(periodRange(utc('2026-01-01'), 'year')).toBe('1 Jan to 31 Dec 2026')
  })
})

describe('formatOrigin', () => {
  it('names the unknown origin and the missing one', () => {
    expect(formatOrigin('Unknown')).toBe('Unknown (API or CLI)')
    expect(formatOrigin(null)).toBe('-')
    expect(formatOrigin(undefined)).toBe('-')
    expect(formatOrigin('bakta.computational.bio')).toBe('bakta.computational.bio')
  })
})
