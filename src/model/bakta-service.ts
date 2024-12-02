import type { BaktaApi } from './bakta-api'
import type { Job, JobResult } from './job'
import { useJobStorage, type BaktaJobStorage } from './storage/local-job-storage'
import type { FailedJobInfo, JobConfig, JobInfo } from './submit'

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
      hasReplicons: true,
      keepContigHeaders: false,
      locus: '',
      locusTag: '',
      minContigLength: 1,
      plasmid: '',
      prodigalTrainingFile: null,
      strain: '',
      translationTable: 11,
    },
    ...init,
  }
}

export type JobList = ((FailedJobInfo | JobInfo) & { key: string })[]

export interface BaktaService {
  submitJob(req: BaktaJobRequest): Promise<void>
  /**
   * Retrieves information on all jobs that are stored locally.
   */
  listJobs(): Promise<JobList>
  /**
   * Removes jobs from local storage that are not available on the server anymore.
   */
  removeOutdatedJobs(): Promise<void>
  job(job: Job): Promise<JobInfo>
  result(job: Job): Promise<JobResult>
}

function generateRepliconTable(replicons: Replicon[]): string {
  return replicons.map((x) => [x.id, x.new, x.type, x.topology, x.name].join('\t')).join('\n')
}

class BaktaServiceImpl implements BaktaService {
  #api: BaktaApi
  #storage: BaktaJobStorage

  constructor(baktaApi: BaktaApi) {
    this.#api = baktaApi
    this.#storage = useJobStorage()
  }
  removeOutdatedJobs(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  submitJob(request: BaktaJobRequest): Promise<void> {
    return this.#api.initJob({ name: request.jobName, repliconTableType: 'TSV' }).then((job) => {
      const uploads = [
        fetch(job.uploadLinkFasta, { method: 'PUT', body: request.sequence }),
        fetch(job.uploadLinkReplicons, {
          method: 'PUT',
          body: generateRepliconTable(request.replicons),
        }),
      ]
      // if (request.prodigalTrainingFile)
      uploads.push(
        fetch(job.uploadLinkProdigal, {
          method: 'PUT',
          body: request.prodigalTrainingFile,
        }),
      )

      return Promise.all(uploads).then(() =>
        this.#api.startJob({ job: job.job, config: request.config }).then(() => {
          // persist job
          const jobs = this.#storage.get()
          jobs.push(job.job)
          this.#storage.save(jobs)
          return
        }),
      )
    })
  }
  listJobs(): Promise<JobList> {
    const allJobs = this.#storage.get()
    const jobIdx: Record<string, Job> = {}
    for (const j of allJobs) {
      jobIdx[j.jobID] = j
    }
    return this.#api.listJob(allJobs).then((x) => {
      const out: JobList = [
        ...x.jobs.map((y) => ({ ...y, key: this.#storage.key(jobIdx[y.jobID]) })),
        ...x.failedJobs.map((y) => ({ ...y, key: this.#storage.key(jobIdx[y.jobID]) })),
      ]
      return out
    })
  }

  job(job: Job): Promise<JobInfo> {
    return this.#api.listJob([job]).then((x) =>
      x.jobs.length > 0
        ? x.jobs[0]
        : {
            jobID: job.jobID,
            jobStatus: 'ERROR',
            name: '',
            started: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
    )
  }
  result(job: Job): Promise<JobResult> {
    return this.#api.jobResult(job)
  }
}

export function createBaktaService(baktaApi: BaktaApi) {
  return new BaktaServiceImpl(baktaApi)
}
