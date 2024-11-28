import type { BaktaApi } from './bakta-api'
import type { Job, JobResult } from './job'
import type { JobConfig, JobInfo } from './submit'

export type Replicon = {
  id: string
  length: number
  new: string
  name: string
  type: string
  topology: string
}

export type BaktaJobRequest = {
  jobName: string
  sequence: string
  prodigalTrainingFile: File | null
  replicons: Replicon[]
  config: JobConfig
}

export function createBaktaJobRequest(init?: Partial<BaktaJobRequest>): BaktaJobRequest {
  return {
    jobName: '',
    sequence: '',
    prodigalTrainingFile: null,
    replicons: [],
    config: {
      completeGenome: false,
      compliant: false,
      dermType: 'UNKNOWN',
      genus: '',
      species: '',
      hasReplicons: false,
      keepContigHeaders: false,
      locus: '',
      locusTag: '',
      minContigLength: 500,
      plasmid: '',
      prodigalTrainingFile: null,
      strain: '',
      translationTable: 11,
    },
    ...init,
  }
}

export interface BaktaService {
  submitJob(req: BaktaJobRequest): Promise<void>
  listJobs(options: { removeOutdatedJobs: boolean; hideLocalOnlyJobs: boolean }): Promise<Job>
  job(job: Job): Promise<JobInfo>
  result(job: Job): Promise<JobResult>
}

let instance: BaktaService
export function initBaktaService(baktaApi: BaktaApi) {}
