import { z, type ZodType } from 'zod'
import {
  JobSchema,
  ResultKindSchema,
  UploadKindSchema,
  WorkflowKindSchema,
  type Job,
  type ResultKind,
  type UploadKind,
  type WorkflowKind,
} from './job'

export const DermTypes = ['MONODERM', 'DIDERM', 'UNKNOWN'] as const
export type DermType = (typeof DermTypes)[number]

export type InitRequest = {
  name: string
  workflowKind: WorkflowKind
}

export type UploadDescriptor = {
  uploadKind: UploadKind
  required: boolean
}

export const UploadDescriptorSchema: ZodType<UploadDescriptor> = z.object({
  uploadKind: UploadKindSchema,
  required: z.boolean(),
})

export type UploadLink = UploadDescriptor & {
  url: string
}

export const UploadLinkSchema: ZodType<UploadLink> = z.object({
  uploadKind: UploadKindSchema,
  required: z.boolean(),
  url: z.string(),
})

export type InitResponse = {
  job: Job
  workflowKind: WorkflowKind
  uploads: UploadLink[]
}

export const InitResponseSchema: ZodType<InitResponse> = z.object({
  job: JobSchema,
  workflowKind: WorkflowKindSchema,
  uploads: z.array(UploadLinkSchema),
})

export type JobConfig = {
  useProdigalTrainingFile: boolean
  useReplicons: boolean
  useRegions: boolean
  useTrustedProteins: boolean
  useHmms: boolean
  completeGenome: boolean
  compliant: boolean
  dermType: DermType
  genus: string | null
  keepContigHeaders: boolean
  locus: string | null
  locusTag: string | null
  locusTagIncrement: number
  meta: boolean
  minContigLength: number
  plasmid: string | null
  species: string | null
  strain: string | null
  translationTable: number
  skipTrna: boolean
  skipTmrna: boolean
  skipRrna: boolean
  skipNcrna: boolean
  skipNcrnaRegion: boolean
  skipCrispr: boolean
  skipCds: boolean
  skipPseudo: boolean
  skipSorf: boolean
  skipGap: boolean
  skipOri: boolean
  skipFilter: boolean
  skipPlot: boolean
}

export type StartRequest = {
  config?: JobConfig
  job: Job
  workflowKind: WorkflowKind
}

const FailedJobStatuses = ['NOT_FOUND', 'UNAUTHORIZED'] as const
export type FailedJobStatus = (typeof FailedJobStatuses)[number]

export type FailedJobInfo = {
  jobID: string
  jobStatus: FailedJobStatus
  workflowKind?: WorkflowKind
}

export const FailedJobInfoSchema: ZodType<FailedJobInfo> = z.object({
  jobID: z.string(),
  jobStatus: z.enum(FailedJobStatuses),
  workflowKind: WorkflowKindSchema.optional(),
})

const JobStatuses = ['INIT', 'RUNNING', 'SUCCESSFULL', 'ERROR', 'SUCCESSFUL'] as const
export type JobStatus = (typeof JobStatuses)[number]

export type JobInfo = {
  jobID: string
  jobStatus: JobStatus
  name: string
  started: string
  updated: string
  workflowKind: WorkflowKind
  resultKind: ResultKind
}

export const JobInfoSchema: ZodType<JobInfo> = z.object({
  jobID: z.string(),
  jobStatus: z.enum(JobStatuses),
  name: z.string(),
  started: z.string(),
  updated: z.string(),
  workflowKind: WorkflowKindSchema,
  resultKind: ResultKindSchema,
})

export type ListResponse = {
  failedJobs: FailedJobInfo[]
  jobs: JobInfo[]
}

export const ListResponseSchema: ZodType<ListResponse> = z.object({
  failedJobs: z.array(FailedJobInfoSchema),
  jobs: z.array(JobInfoSchema),
})

export const StageStatuses = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'error',
  'unknown',
] as const
export type StageStatus = (typeof StageStatuses)[number]

export type StageLog = {
  stage: string
  status: StageStatus
  content: string
}

export const StageLogSchema: ZodType<StageLog> = z.object({
  stage: z.string(),
  status: z.enum(StageStatuses),
  content: z.string(),
})

export type WorkflowLogs = {
  workflowKind: WorkflowKind
  stages: StageLog[]
}

export const WorkflowLogsSchema: ZodType<WorkflowLogs> = z.object({
  workflowKind: WorkflowKindSchema,
  stages: z.array(StageLogSchema),
})

export type WorkflowDescriptor = {
  workflowKind: WorkflowKind
  resultKind: ResultKind
  uploads: UploadDescriptor[]
  stages: string[]
}

export const WorkflowDescriptorSchema: ZodType<WorkflowDescriptor> = z.object({
  workflowKind: WorkflowKindSchema,
  resultKind: ResultKindSchema,
  uploads: z.array(UploadDescriptorSchema),
  stages: z.array(z.string()),
})
