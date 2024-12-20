import type { Result, Feature } from './model/result-data'

function genomeName(bakta: Result) {
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

function formattedSize(bakta: Result) {
  return new Intl.NumberFormat('en-GB').format(bakta.stats.size) + ' bp'
}

function featureCount(bakta: Result) {
  const counts: Record<string, number> = {
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

  for (const f of bakta.features) {
    if (!(f.type in counts)) {
      counts[f.type] = 0
    }
    counts[f.type] = counts[f.type] + 1
  }
  return counts
}

function sequencesCountString(bakta: Result): string {
  const data = bakta.sequences.map((x) => (x.complete ? 'complete ' : '') + x.type)
  const counts: Record<string, number> = {}

  for (const c of data) {
    if (!(c in counts)) {
      counts[c] = 0
    }
    counts[c] = counts[c] + 1
  }
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

function lookupCogFunctionalCategories(feature: Feature) {
  if (feature.db_xrefs !== undefined) {
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

export default {
  genomeName,
  formattedSize,
  featureCount,
  sequencesCountString,
  lookupCogFunctionalCategories,
}
