import { z, type ZodType } from 'zod'

export type Version = { toolVersion: string; dbVersion: string }
export const VersionSchema: ZodType<Version> = z.object({
  toolVersion: z.string(),
  dbVersion: z.string(),
})
