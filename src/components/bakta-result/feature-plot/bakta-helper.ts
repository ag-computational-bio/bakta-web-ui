import type { Result, Feature, Sequence } from '@/model/result-data'
import cog from '@/cog-helper'

function genomeName(bakta: Result | undefined): string {
  if (!bakta) return 'N.A.'
  if (!bakta.genome.genus && !bakta.genome.genus && !bakta.genome.species) {
    return 'N.A.'
  }
  if (bakta.genome.genus) {
    return (
      bakta.genome.genus +
      (bakta.genome.species ? ' ' + bakta.genome.species : '') +
      (bakta.genome.strain ? ' ' + bakta.genome.strain : '')
    )
  } else {
    return (
      'N.A. ' +
      (bakta.genome.species ? bakta.genome.species + ' ' : '') +
      (bakta.genome.strain ? bakta.genome.strain + ' ' : '')
    )
  }
}

function formattedSize(bakta: Result | undefined): string {
  if (!bakta) return '0 bp'
  return new Intl.NumberFormat('en-GB').format(bakta.stats.size) + ' bp'
}

type FeatureCount = {
  oriC: number
  oriV: number
  oriT: number
  cds: number
  gap: number
  sorf: number
  'ncRNA-region': number
  ncRNA: number
  rRNA: number
  tmRNA: number
  crispr: number
  tRNA: number
}
function featureCount(bakta: Result | undefined): FeatureCount {
  const fc: FeatureCount = {
    oriC: 0,
    oriV: 0,
    oriT: 0,
    cds: 0,
    gap: 0,
    sorf: 0,
    'ncRNA-region': 0,
    ncRNA: 0,
    rRNA: 0,
    tmRNA: 0,
    crispr: 0,
    tRNA: 0,
  }
  if (!bakta) return fc
  return bakta.features.reduce((acc: Record<string, number>, cur: Feature) => {
    const key = cur.type
    if (!(key in acc)) {
      acc[key] = 0
    }
    acc[key] = acc[key] + 1
    return acc
  }, fc) as FeatureCount
}

function sequencesCountString(bakta: Result | undefined): string {
  if (!bakta) return '0 contigs'
  const data = bakta.sequences.map((x) => (x.complete ? 'complete ' : '') + x.type)
  const counts = data.reduce((acc: Record<string, number>, cur) => {
    if (!(cur in acc)) {
      acc[cur] = 0
    }
    acc[cur] = acc[cur] + 1
    return acc
  }, {})
  const string = Object.entries(counts)
    .sort()
    .map((x) => {
      let s = x[1] + ' ' + x[0]
      if (x[1] > 1) {
        s += 's'
      }
      return s
    })
    .join(', ')
  return string
}

function lookupCogFunctionalCategories(feature: Feature): string[] {
  if ('db_xrefs' in feature && feature.db_xrefs) {
    const categories = feature.db_xrefs
      .filter((x) => x.match(/^COG:[A-Z]+$/))
      .map((x) => x.substring(4))
    if (categories.length > 0) {
      if (categories[0].length > 1) {
        return categories[0].split('')
      }
    }
    return categories
  }
  return []
}

function lookupCogColorForFeature(feature: Feature): string {
  const categories = lookupCogFunctionalCategories(feature)
  return cog.lookupCogColor(categories, cog.cogMap)
}

function createSequence(init?: Partial<Sequence>): Sequence {
  return {
    id: '',
    complete: false,
    length: 0,
    nt: '',
    type: '',
    ...init,
  }
}

export default {
  genomeName,
  formattedSize,
  featureCount,
  sequencesCountString,
  lookupCogFunctionalCategories,
  lookupCogColorForFeature,
  createSequence,
}
