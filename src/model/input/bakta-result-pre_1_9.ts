import { z } from 'zod'

export const BaktaGenomeSchema = z.object({
  genus: z.string().nullable(),
  species: z.string().nullable(),
  strain: z.string().nullable(),
  complete: z.boolean().optional(),
  gram: z.string().optional(),
  translation_table: z.number().optional(),
})

export const BaktaStatsSchema = z.object({
  no_sequences: z.number().optional(),
  size: z.number(),
  gc: z.number(),
  n_ratio: z.number(),
  n50: z.number(),
  coding_ratio: z.number(),
})

export const BaktaFeatureSchema = z.object({
  type: z.string(),
  contig: z.string().optional(),
  sequence: z.string().optional(),
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

export const BaktaSequenceSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  sequence: z.string().optional(),
  nt: z.string().optional(),
  length: z.number(),
  complete: z.boolean(),
  type: z.string(),
  topology: z.string().optional(),
  simple_id: z.string().optional(),
})

export const BaktaRunSchema = z.object({
  start: z.string(),
  end: z.string(),
})

const BaktaVersionSchema = z.object({
  bakta: z.string(),
  db: z.string(),
})

export const BaktaResultSchema = z.object({
  genome: BaktaGenomeSchema,
  stats: BaktaStatsSchema,
  features: z.array(BaktaFeatureSchema),
  sequences: z.array(BaktaSequenceSchema),
  run: BaktaRunSchema.optional(),
  version: BaktaVersionSchema.optional(),
})

export type BaktaGenome = z.infer<typeof BaktaGenomeSchema>
export type BaktaStats = z.infer<typeof BaktaStatsSchema>
export type BaktaFeature = z.infer<typeof BaktaFeatureSchema>
export type BaktaSequence = z.infer<typeof BaktaSequenceSchema>
export type BaktaRun = z.infer<typeof BaktaRunSchema>
export type BaktaVersion = z.infer<typeof BaktaVersionSchema>
export type BaktaResult = z.infer<typeof BaktaResultSchema>
