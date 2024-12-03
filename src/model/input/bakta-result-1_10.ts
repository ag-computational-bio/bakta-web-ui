import { z } from 'zod'
import { BaktaGenomeSchema, BaktaRunSchema } from './bakta-result-pre_1_9'

const BaktaVersionSchema_1_10 = z.object({
  bakta: z.string(),
  db: z.object({
    version: z.string(),
    type: z.string(),
  }),
})
export const BaktaStatsSchema_1_10 = z.object({
  size: z.number(),
  gc: z.number(),
  n_ratio: z.number(),
  n50: z.number(),
  coding_ratio: z.number(),
})

const BaktaFeatureSchema_1_10 = z.object({
  type: z.string(),
  sequence: z.string(),
  start: z.number(),
  stop: z.number(),
  strand: z.string(),
  gene: z.optional(z.nullable(z.string())),
  product: z.optional(z.nullable(z.string())),
  start_type: z.optional(z.string()),
  rbs_motif: z.optional(z.nullable(z.string())),
  db_xrefs: z.optional(z.array(z.string())),
  frame: z.optional(z.number()),
  aa: z.optional(z.string()),
  aa_hexdigest: z.optional(z.string()),
  nt: z.optional(z.string()),
  // TODO This schema does not contains all fields. Add missing fields as soon as they are required
  // ups, ips, psc, pscc, trna attributes
  id: z.string(),
  locus: z.optional(z.string()),
})
const BaktaSequenceSchema_1_10 = z.object({
  id: z.string(),
  description: z.string(),
  nt: z.string(),
  length: z.number(),
  complete: z.boolean(),
  type: z.string(),
  topology: z.string(),
  orig_description: z.string(),
  orig_id: z.string(),
})

export const BaktaResultSchema_1_10 = z.object({
  genome: BaktaGenomeSchema,
  stats: BaktaStatsSchema_1_10,
  features: z.array(BaktaFeatureSchema_1_10),
  sequences: z.array(BaktaSequenceSchema_1_10),
  run: BaktaRunSchema,
  version: BaktaVersionSchema_1_10,
})

export type BaktaSequence_1_10 = z.infer<typeof BaktaSequenceSchema_1_10>
export type BaktaFeature_1_10 = z.infer<typeof BaktaFeatureSchema_1_10>
export type BaktaResult_1_10 = z.infer<typeof BaktaResultSchema_1_10>
