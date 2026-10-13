import { afterEach, describe, expect, it } from 'vitest'
import {
  chartInterval,
  filterQuery,
  filters,
  previousFilter,
  previousLabel,
  rangeDescription,
  readFilterQuery,
  statsFilter,
} from './admin-filters'

const now = new Date('2026-10-11T12:00:00Z')

afterEach(() => Object.assign(filters, { range: '30d', customFrom: '', customTo: '' }))

describe('chartInterval', () => {
  it('maps the fixed ranges', () => {
    expect(chartInterval('today', {}, now)).toBe('day')
    expect(chartInterval('7d', {}, now)).toBe('day')
    expect(chartInterval('30d', {}, now)).toBe('day')
    expect(chartInterval('90d', {}, now)).toBe('week')
    expect(chartInterval('12m', {}, now)).toBe('month')
  })

  it('uses years for all time only above three years of data', () => {
    expect(chartInterval('all', {}, now)).toBe('month')
    expect(chartInterval('all', {}, now, '2024-01-01T00:00:00Z')).toBe('month')
    expect(chartInterval('all', {}, now, '2022-01-01T00:00:00Z')).toBe('year')
  })

  it('maps the length of a custom range', () => {
    const custom = (from: string, to: string) =>
      chartInterval('custom', { from: `${from}T00:00:00Z`, to: `${to}T00:00:00Z` }, now)
    expect(custom('2026-01-01', '2026-02-15')).toBe('day')
    expect(custom('2026-01-01', '2026-02-16')).toBe('week')
    expect(custom('2026-01-01', '2026-07-20')).toBe('week')
    expect(custom('2026-01-01', '2026-08-01')).toBe('month')
    expect(custom('2023-01-01', '2026-01-01')).toBe('month')
    expect(custom('2020-01-01', '2026-01-01')).toBe('year')
  })

  it('uses the first data point when a custom range has no start', () => {
    const to = { to: '2026-10-01T00:00:00Z' }
    expect(chartInterval('custom', to, now)).toBe('month')
    expect(chartInterval('custom', to, now, '2026-09-10T00:00:00Z')).toBe('day')
  })
})

describe('time range', () => {
  it('starts the fixed ranges before now', () => {
    filters.range = '7d'
    expect(statsFilter(now).from).toBe('2026-10-04T12:00:00.000Z')
    filters.range = '90d'
    expect(statsFilter(now).from).toBe('2026-07-13T12:00:00.000Z')
    filters.range = 'today'
    expect(statsFilter(now).from).toBe('2026-10-11T00:00:00.000Z')
  })

  it('keeps only the range and the custom dates in the URL', () => {
    expect(filterQuery()).toEqual({ range: undefined, from: undefined, to: undefined })
    Object.assign(filters, { range: '90d', customFrom: '2026-01-01' })
    expect(filterQuery()).toEqual({ range: '90d', from: undefined, to: undefined })
    readFilterQuery({ range: 'custom', from: '2026-01-01' })
    expect(filters).toMatchObject({ range: 'custom', customFrom: '2026-01-01', customTo: '' })
    expect(filterQuery()).toEqual({ range: 'custom', from: '2026-01-01', to: undefined })
  })

  it('restores the default range when the URL has none', () => {
    readFilterQuery({ range: '90d' })
    expect(filters.range).toBe('90d')
    readFilterQuery({})
    expect(filters.range).toBe('30d')
    readFilterQuery({ range: 'unknown' })
    expect(filters.range).toBe('30d')
  })

  it('uses the default range for dates that do not exist', () => {
    for (const to of ['bad', '2026-13-01', '2026-02-30']) {
      Object.assign(filters, { range: '90d' })
      readFilterQuery({ range: 'custom', from: '2026-01-01', to })
      expect(filters).toMatchObject({ range: '30d', customFrom: '', customTo: '' })
      expect(() => statsFilter(now)).not.toThrow()
    }
    readFilterQuery({ range: 'custom', from: '2024-02-29', to: '2024-03-01' })
    expect(filters).toMatchObject({ customFrom: '2024-02-29', customTo: '2024-03-01' })
  })
})

describe('rangeDescription', () => {
  it('shows the dates of the preset ranges', () => {
    expect(rangeDescription('today', now)).toBe('Since 00:00 UTC')
    expect(rangeDescription('7d', now)).toBe('4 Oct 2026 to today')
    expect(rangeDescription('12m', now)).toBe('11 Oct 2025 to today')
    expect(rangeDescription('all', now)).toBe('Every job')
  })
})

describe('previousFilter', () => {
  it('takes the period of the same length before the range', () => {
    expect(
      previousFilter(
        { environment: 'production', from: '2026-10-01T00:00:00Z', to: '2026-10-11T00:00:00Z' },
        now,
      ),
    ).toEqual({
      environment: 'production',
      from: '2026-09-21T00:00:00.000Z',
      to: '2026-10-01T00:00:00.000Z',
    })
    expect(previousFilter({ environment: 'all', from: '2026-10-04T12:00:00Z' }, now)?.from).toBe(
      '2026-09-27T12:00:00.000Z',
    )
    expect(previousFilter({ environment: 'all' }, now)).toBeUndefined()
    // the same minute gives the same period
    const filter = { environment: 'all' as const, from: '2026-10-04T12:00:00Z' }
    expect(previousFilter(filter, new Date('2026-10-11T12:00:05Z'))).toEqual(
      previousFilter(filter, new Date('2026-10-11T12:00:55Z')),
    )
    expect(previousLabel('30d')).toBe('previous 30 days')
    expect(previousLabel('custom')).toBe('previous period')
    expect(previousLabel('today')).toBe('previous period')
  })
})
