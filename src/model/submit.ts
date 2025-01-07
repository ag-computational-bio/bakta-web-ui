import { z, ZodType } from 'zod'
import { JobSchema, type Job } from './job'

export const DermTypes = ['MONODERM', 'DIDERM', 'UNKNOWN'] as const
export type DermType = (typeof DermTypes)[number]

export const RepliconTableTypes = ['TSV', 'CSV'] as const
export type RepliconTableType = (typeof RepliconTableTypes)[number]

export type VersionResponse = {
  backendVersion: string
  dbVersion: string
  toolVersion: string
}

export type InitRequest = {
  name: string
  repliconTableType: RepliconTableType
}

export type InitResponse = {
  job: Job
  uploadLinkFasta: string
  uploadLinkProdigal: string
  uploadLinkReplicons: string
}

export const InitResponseSchema: ZodType<InitResponse> = z.object({
  job: JobSchema,
  uploadLinkFasta: z.string(),
  uploadLinkProdigal: z.string(),
  uploadLinkReplicons: z.string(),
})

export type JobConfig = {
  completeGenome: boolean
  compliant: boolean
  dermType: DermType
  genus: string | null
  hasReplicons: boolean
  keepContigHeaders: boolean
  locus: string | null
  locusTag: string | null
  minContigLength: number
  plasmid: string | null
  prodigalTrainingFile: string | null
  species: string | null
  strain: string | null
  translationTable: number
}

export type StartRequest = {
  config: JobConfig
  job: Job
}

const FailedJobStatuses = ['NOT_FOUND', 'UNAUTHORIZED'] as const
export type FailedJobStatus = (typeof FailedJobStatuses)[number]

export type FailedJobInfo = {
  jobID: string
  jobStatus: FailedJobStatus
}

export const FailedJobInfoSchema: ZodType<FailedJobInfo> = z.object({
  jobID: z.string(),
  jobStatus: z.enum(FailedJobStatuses),
})

// Migration quirk: In order to support the old SUCCESSFULL state and the new SUCCCESSFUL state
// we include both here. As soon as the old server is replaced with one with the new spelling
// the old SUCCESSFULL state can be removed
const JobStatuses = ['INIT', 'RUNNING', 'SUCCESSFULL', 'ERROR', 'SUCCESSFUL'] as const
export type JobStatus = (typeof JobStatuses)[number]
export type JobInfo = {
  jobID: string
  jobStatus: JobStatus
  name: string
  started: string
  updated: string
}
export const JobInfoSchema: ZodType<JobInfo> = z.object({
  jobID: z.string(),
  jobStatus: z.enum(JobStatuses),
  name: z.string(),
  started: z.string(),
  updated: z.string(),
})
export type ListResponse = {
  failedJobs: FailedJobInfo[]
  jobs: JobInfo[]
}

export const ListResponseSchema: ZodType<ListResponse> = z.object({
  failedJobs: z.array(FailedJobInfoSchema),
  jobs: z.array(JobInfoSchema),
})
