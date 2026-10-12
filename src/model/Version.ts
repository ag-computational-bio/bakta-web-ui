import { z, type ZodType } from 'zod'

export type Version = {
  backendVersion: string
  baktaVersion: string
  baktaDbVersion: string
  baktfoldVersion: string
  baktfoldDbVersion: string
}

export const VersionSchema: ZodType<Version> = z.object({
  backendVersion: z.string(),
  baktaVersion: z.string(),
  baktaDbVersion: z.string(),
  baktfoldVersion: z.string(),
  baktfoldDbVersion: z.string(),
})
