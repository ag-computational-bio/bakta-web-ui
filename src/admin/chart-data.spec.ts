import { describe, expect, it } from 'vitest'
import type { Bucket } from './admin-api'
import { bucketValues, chartPeriods, chartTsv, pointIndexes } from './chart-data'

function bucket(start: string, group: string | null, total: number, p50?: number): Bucket {
  return {
    period_start: start,
    group,
    jobs_total: total,
    jobs_succeeded: total,
    jobs_failed: 0,
    runtime_p50: p50,
    runtime_avg: p50,
  }
}

const now = new Date('2026-04-15T12:00:00Z')

describe('chartPeriods', () => {
  it('starts at the first bucket for all time', () => {
    const list = chartPeriods(
      [bucket('2026-02-01T00:00:00Z', null, 1)],
      { environment: 'all' },
      'month',
      now,
    )
    expect(list.map((d) => d.toISOString().slice(0, 7))).toEqual(['2026-02', '2026-03', '2026-04'])
  })

  it('is empty without data and without range', () => {
    expect(chartPeriods([], { environment: 'all' }, 'month', now)).toEqual([])
  })
})

describe('bucketValues', () => {
  const list = chartPeriods([], { environment: 'all', from: '2026-02-10T00:00:00Z' }, 'month', now)
  const buckets = [
    bucket('2026-02-01T00:00:00Z', 'bakta', 3, 400),
    bucket('2026-04-01T00:00:00Z', 'bakta', 5, 300),
    bucket('2026-04-01T00:00:00Z', 'baktfold', 1, 900),
  ]

  it('fills missing counts with zero', () => {
    expect(bucketValues(buckets, list, 'jobs_total')).toEqual({
      bakta: [3, 0, 5],
      baktfold: [0, 0, 1],
    })
  })

  it('keeps input sizes of buckets without sizes empty instead of zero', () => {
    const proteinsOnly = { ...bucket('2026-04-01T00:00:00Z', null, 2), input_p50_bp: null }
    expect(bucketValues([proteinsOnly], list, 'input_p50_bp')).toEqual({ '': [null, null, null] })
  })

  it('leaves missing durations empty', () => {
    expect(bucketValues(buckets, list, 'runtime_p50').bakta).toEqual([400, null, 300])
  })
})

describe('pointIndexes', () => {
  it('gives every value a point with few periods', () => {
    expect(pointIndexes([1, null, 2, 3], true)).toEqual([0, 2, 3])
  })

  it('keeps the isolated values visible with many periods', () => {
    expect(pointIndexes([null, 5, null, 1, 2, null, undefined, 7], false)).toEqual([1, 7])
  })
})

describe('chartPeriods with an end', () => {
  it('does not add a period for the excluded end', () => {
    const filter = {
      environment: 'all' as const,
      from: '2026-01-01T00:00:00Z',
      to: '2026-02-01T00:00:00Z',
    }
    const now = new Date('2026-10-11T00:00:00Z')
    expect(chartPeriods([], filter, 'month', now).map((p) => p.toISOString())).toEqual([
      '2026-01-01T00:00:00.000Z',
    ])
    expect(chartPeriods([], filter, 'day', now)).toHaveLength(31)
  })
})

describe('chartTsv', () => {
  it('has a row per period with a column per series and the total', () => {
    const list = [new Date('2026-02-01T00:00:00Z'), new Date('2026-03-01T00:00:00Z')]
    const series = [
      { key: 'bakta', label: 'Bakta' },
      { key: 'baktfold', label: 'Baktfold' },
    ]
    expect(chartTsv(list, 'month', series, { bakta: [3, 0], baktfold: [1, 2] })).toBe(
      'month\tBakta\tBaktfold\tTotal\n2026-02\t3\t1\t4\n2026-03\t0\t2\t2\n',
    )
    expect(chartTsv(list.slice(0, 1), 'day', series, { bakta: [3] })).toBe(
      'day\tBakta\tBaktfold\tTotal\n2026-02-01\t3\t0\t3\n',
    )
  })
})
