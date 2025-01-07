import { z } from 'zod'

export const JobSchema = z.object({
  jobID: z.string(),
  secret: z.string(),
})

export const JobStatusSchema = z.object({
  jobId: z.string(),
  jobStatus: z.enum(['INIT', 'RUNNING', 'SUCCESSFULL', 'SUCCESSFUL', 'ERROR']),
  name: z.string(),
  started: z.string(),
  updated: z.string(),
})

export const ResultFileKeys = [
  'EMBL',
  'FAA',
  'FAAHypothetical',
  'FFN',
  'FNA',
  'GBFF',
  'GFF3',
  'JSON',
  'TSV',
  'TSVHypothetical',
  'TSVInference',
  'TXTLogs',
  'PNGCircularPlot',
  'SVGCircularPlot',
] as const

export const ResultFilesSchema = z.record(z.enum(ResultFileKeys), z.string())

export const JobResultSchema = z.object({
  jobID: z.string(),
  name: z.string(),
  started: z.string(),
  updated: z.string(),
  ResultFiles: ResultFilesSchema,
})

export type Job = z.infer<typeof JobSchema>
export type JobStatus = z.infer<typeof JobStatusSchema>
export type ResultFiles = z.infer<typeof ResultFilesSchema>
export type JobResult = z.infer<typeof JobResultSchema>
export type ResultFileKey = (typeof ResultFileKeys)[number]
