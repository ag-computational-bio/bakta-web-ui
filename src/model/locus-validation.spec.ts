import { describe, expect, it } from 'vitest'
import { locusError, locusTagError } from './locus-validation'

describe('locusTagError', () => {
  it('accepts empty values', () => {
    expect(locusTagError('', true)).toBe('')
    expect(locusTagError(null, false)).toBe('')
  })
  it('checks compliant mode', () => {
    for (const ok of ['ABC', 'A1B', 'ABCDEFGHIJKL']) expect(locusTagError(ok, true)).toBe('')
    for (const bad of ['AB', 'ABCDEFGHIJKLM', 'abc', '1ABC', 'AB_C', 'AB C', 'bc10_AB461'])
      expect(locusTagError(bad, true)).not.toBe('')
  })
  it('checks default mode', () => {
    expect(locusTagError('bc10_AB461', false)).toBe('')
    expect(locusTagError('a', false)).toBe('')
    expect(locusTagError('a.b-c_1', false)).toBe('')
    expect(locusTagError('A'.repeat(24), false)).toBe('')
    expect(locusTagError('A'.repeat(25), false)).not.toBe('')
    expect(locusTagError('a b', false)).not.toBe('')
    expect(locusTagError(' ', false)).not.toBe('')
    expect(locusTagError('a:b', false)).not.toBe('')
  })
})

describe('locusError', () => {
  it('accepts empty values', () => {
    expect(locusError('')).toBe('')
    expect(locusError(null)).toBe('')
  })
  it('checks the allowed characters and length', () => {
    expect(locusError('contig')).toBe('')
    expect(locusError('a.b:c*d#e-f_g')).toBe('')
    expect(locusError('a'.repeat(20))).toBe('')
    expect(locusError('a'.repeat(21))).not.toBe('')
    expect(locusError('a b')).not.toBe('')
    expect(locusError(' ')).not.toBe('')
    expect(locusError('a/b')).not.toBe('')
  })
})
