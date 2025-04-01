import type { ColorEntry } from '@/cog-helper'
import type { Feature } from '@/model/result-data'

const BaktaFeatureTypes = [
  'tRNA',
  'tmRNA',
  'rRNA',
  'ncRNA',
  'ncRNA-region',
  'crispr',
  'crispr-repeat',
  'crispr-spacer',
  'orf',
  'sorf',
  'cds',
  'signal-peptide',
  'gap',
  'oriC',
  'oriV',
  'oriT',
  'is',
  'mite',
  'unknown',
] as const

export type FeatureType = (typeof BaktaFeatureTypes)[number]
const defaultColor = '#CCCCCC'

export const featureColors: ColorEntry[] = [
  { key: 'sorf', name: '', color: defaultColor },
  { key: 'tRNA', name: '', color: '#b2df8a' },
  { key: 'tmRNA', name: '', color: '#b2df8a' },
  { key: 'rRNA', name: '', color: '#fb8072' },
  { key: 'ncRNA', name: '', color: '#fdb462' },
  { key: 'ncRNA-region', name: '', color: '#80b1d3' },
  { key: 'crispr', name: '', color: '#bebada' },
  { key: 'gap', name: '', color: '#000000' },
  { key: 'crispr-repeat', name: '', color: defaultColor },
  { key: 'crispr-spacer', name: '', color: defaultColor },
  { key: 'signal-peptide', name: '', color: defaultColor },
  { key: 'cds', name: '', color: defaultColor },
  { key: 'is', name: '', color: defaultColor },
  { key: 'mite', name: '', color: defaultColor },
  { key: 'orf', name: '', color: defaultColor },
  { key: 'oriC', name: '', color: defaultColor },
  { key: 'oriT', name: '', color: defaultColor },
  { key: 'oriV', name: '', color: defaultColor },
  { key: 'unknown', name: '', color: '#666666' },
]

const featureColorScheme: Record<FeatureType, string> = {
  sorf: '#cccccc',
  tRNA: '#b2df8a',
  tmRNA: '#b2df8a',
  rRNA: '#fb8072',
  ncRNA: '#fdb462',
  'ncRNA-region': '#80b1d3',
  crispr: '#bebada',
  gap: '#000000',
  'crispr-repeat': defaultColor,
  'crispr-spacer': defaultColor,
  'signal-peptide': defaultColor,
  cds: defaultColor,
  is: defaultColor,
  mite: defaultColor,
  orf: defaultColor,
  oriC: defaultColor,
  oriT: defaultColor,
  oriV: defaultColor,
  unknown: '#666666',
}

export function lookupFeatureColor(f: Feature): string {
  if (f.type in featureColorScheme) return featureColorScheme[f.type as FeatureType]
  return featureColorScheme.unknown
}
