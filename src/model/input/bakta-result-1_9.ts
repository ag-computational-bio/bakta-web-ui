import { z } from 'zod'
import {
  BaktaFeatureSchema,
  BaktaGenomeSchema,
  BaktaRunSchema,
  BaktaSequenceSchema,
  BaktaStatsSchema,
} from './bakta-result-pre_1_9'

const BaktaVersionSchema_1_9 = z.object({
  bakta: z.string(),
  db: z.object({
    version: z.string(),
    type: z.string(),
  }),
})

export const BaktaResultSchema_1_9 = z.object({
  genome: BaktaGenomeSchema,
  stats: BaktaStatsSchema,
  features: z.array(BaktaFeatureSchema),
  sequences: z.array(BaktaSequenceSchema),
  run: BaktaRunSchema,
  version: BaktaVersionSchema_1_9,
})

export type BaktaResult_1_9 = z.infer<typeof BaktaResultSchema_1_9>
