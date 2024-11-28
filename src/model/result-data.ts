import { z, type SafeParseReturnType } from 'zod'
import {
  BaktaResultSchema_1_10,
  type BaktaFeature_1_10,
  type BaktaResult_1_10,
  type BaktaSequence_1_10,
} from './input/bakta-result-1_10'
import {
  BaktaResultSchema,
  type BaktaFeature,
  type BaktaResult,
  type BaktaSequence,
} from './input/bakta-result-pre-1_10'

export type Feature = {
  db_xrefs: string[] | undefined
  type: string
  sequence: string
  start: number
  stop: number
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
  }
  features: Feature[]
  sequences: Sequence[]
}

const AllBaktaResultSchemas = z.union([BaktaResultSchema, BaktaResultSchema_1_10])

function toFeature(f: BaktaFeature | BaktaFeature_1_10): Feature {
  return {
    db_xrefs: f.db_xrefs,
    gene: f.gene,
    locus: f.locus,
    product: f.product,
    sequence: 'contig' in f ? f.contig : f.sequence,
    start: f.start,
    stop: f.stop,
    strand: f.strand,
    type: f.type,
  }
}

function toSequence(f: BaktaSequence | BaktaSequence_1_10): Sequence {
  return {
    complete: f.complete,
    id: f.id,
    length: f.length,
    nt: 'sequence' in f ? f.sequence : f.nt,
    type: f.type,
  }
}

function toResult(input: BaktaResult | BaktaResult_1_10): Result {
  return {
    genome: {
      genus: input.genome.genus ?? '',
      species: input.genome.species ?? '',
      strain: input.genome.strain ?? '',
    },
    stats: {
      size: input.stats.size,
    },
    features: input.features.map(toFeature),
    sequences: input.sequences.map(toSequence),
  }
}

export function safeParseResult(o: unknown): SafeParseReturnType<unknown, Result> {
  const r = AllBaktaResultSchemas.safeParse(o)
  if (!r.success) return { ...r }
  return { success: true, data: toResult(r.data) }
}

export function parseBaktaData(o: unknown): Result {
  const d = safeParseResult(o)
  if (d.success) return d.data
  throw d.error.errors
}
