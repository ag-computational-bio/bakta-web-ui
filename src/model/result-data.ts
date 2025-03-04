import { z, type SafeParseReturnType } from 'zod'
import {
  BaktaResultSchema_1_10,
  type BaktaFeature_1_10,
  type BaktaResult_1_10,
  type BaktaSequence_1_10,
} from './input/bakta-result-1_10'
import { BaktaResultSchema_1_9, type BaktaResult_1_9 } from './input/bakta-result-1_9'
import {
  BaktaResultSchema,
  type BaktaFeature,
  type BaktaResult,
  type BaktaSequence,
} from './input/bakta-result-pre_1_9'

export type Feature = {
  id: string
  db_xrefs: string[] | undefined
  type: string
  sequence: string
  start: number
  stop: number
  frame?: number
  rbs_motif?: string | null
  strand: string
  locus: string | undefined
  product: string | null | undefined
  gene: string | null | undefined
}
export type Sequence = {
  id: string
  complete: boolean
  type: string
  length: number
  nt: string
}

export type Result = {
  genome: {
    genus: string
    species: string
    strain: string
  }
  stats: {
    size: number
    gc: number
    n_ratio: number
    n50: number
    n90: number | undefined
    coding_ration: number
  }
  features: Feature[]
  sequences: Sequence[]
}

const AllBaktaResultSchemas = z.union([
  BaktaResultSchema,
  BaktaResultSchema_1_10,
  BaktaResultSchema_1_9,
])

/**
 * Translates bakta json coordinates to gff3 coordinates.
 *
 * bakta coordinates:
 *   start < stop => normal feature
 *   start > stop => feature accross origin
 * gff3 coordinates
 *   start is always < end
 *   features that cross the origin have a end coordinate > seqLength
 *
 * @param f
 * @param seqLen
 * @returns
 */
function baktaToGffCoordinates(
  f: BaktaFeature | BaktaFeature_1_10,
  seqLen: number,
): [number, number] {
  if (f.start > f.stop) {
    return [f.start, seqLen + f.stop]
  } else {
    return [f.start, f.stop]
  }
}

function toFeature(f: BaktaFeature | BaktaFeature_1_10, seqLen: number): Feature {
  const coords = baktaToGffCoordinates(f, seqLen)
  return {
    id: f.id,
    frame: f.frame,
    rbs_motif: f.rbs_motif,
    db_xrefs: f.db_xrefs,
    gene: f.gene,
    locus: f.locus,
    product: f.product,
    sequence: 'contig' in f ? f.contig : f.sequence,
    start: coords[0],
    stop: coords[1],
    strand: f.strand,
    type: f.type,
  }
}

function toSequence(f: BaktaSequence | BaktaSequence_1_10): Sequence {
  const v: Sequence = {
    id: f.id,
    complete: f.complete,
    length: f.length,
    nt: 'sequence' in f ? f.sequence : f.nt,
    type: f.type,
  }
  return v
}

function toResult(input: BaktaResult | BaktaResult_1_9 | BaktaResult_1_10): Result {
  const sequences = input.sequences.map(toSequence)
  const seqIdx: Record<string, number> = {}
  for (const s of sequences) seqIdx[s.id] = s.length
  const features = input.features.map((f) =>
    toFeature(f, seqIdx['contig' in f ? f.contig : f.sequence]),
  )

  return {
    genome: {
      genus: input.genome.genus ?? '',
      species: input.genome.species ?? '',
      strain: input.genome.strain ?? '',
    },
    stats: {
      size: input.stats.size,
      gc: input.stats.gc,
      coding_ration: input.stats.coding_ratio,
      n50: input.stats.n50,
      n90: 'n90' in input.stats ? input.stats.n90 : undefined,
      n_ratio: input.stats.n_ratio,
    },
    features: features,
    sequences: sequences,
  }
}

export function safeParseResult(o: unknown): SafeParseReturnType<unknown, Result> {
  const r = AllBaktaResultSchemas.safeParse(o)
  if (!r.success) return { ...r }
  const converted = toResult(r.data)
  return { success: true, data: converted }
}

export function parseBaktaData(o: unknown): Result {
  const d = safeParseResult(o)
  if (d.success) return d.data
  throw d.error.errors
}
