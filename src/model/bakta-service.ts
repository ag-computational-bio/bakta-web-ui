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
  submitJob(req: BaktaJobRequest): Promise<Job & { key: string }>
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
  removeJob(jobID: string): Promise<void>
  logs(jobID: string): Promise<string>
}

function generateRepliconTable(replicons: Replicon[]): string {
  return replicons.map((x) => [x.id, x.new, x.type, x.topology, x.name].join('\t')).join('\n')
}

class BaktaServiceImpl implements BaktaService {
  #api: BaktaApi
  #storage: BaktaJobStorage

  constructor(baktaApi: BaktaApi, storage?: BaktaJobStorage) {
    this.#api = baktaApi
    this.#storage = storage ?? useJobStorage()
  }
  logs(jobID: string): Promise<string> {
    const jobs = this.#storage.get()
    const idx = jobs.findIndex((x) => x.jobID === jobID)
    if (idx < 0) return Promise.reject('Job not found')
    const job = jobs[idx]
    return this.#api.jobLogs(job)
  }
  removeOutdatedJobs(): Promise<void> {
    const jobs = this.#storage.get()
    return this.listJobs().then((resp) => {
      const availableJobIds = new Set()
      for (const j of resp) {
        if (j.jobStatus !== 'NOT_FOUND') availableJobIds.add(j.jobID)
      }
      const availableJobs = jobs.filter((x) => availableJobIds.has(x.jobID))
      this.#storage.save(availableJobs)
      return
    })
  }
  submitJob(request: BaktaJobRequest): Promise<Job & { key: string }> {
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
          return { ...job.job, key: this.#storage.key(job.job) }
        }),
      )
    })
  }
  listJobs(): Promise<JobList> {
    const allJobs = this.#storage.get()
    if (allJobs.length == 0) return Promise.resolve([])
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
    return this.#api
      .listJob([job])
      .then((x) => (x.jobs.length > 0 ? x.jobs[0] : Promise.reject('Job not found')))
  }
  result(job: Job): Promise<JobResult> {
    return this.#api.jobResult(job)
  }
  removeJob(jobID: string): Promise<void> {
    const jobs = this.#storage.get()
    const idx = jobs.findIndex((x) => x.jobID === jobID)
    if (idx < 0) return Promise.reject('Job not found')
    const job = jobs[idx]
    const updatedJobs = [...jobs]
    updatedJobs.splice(idx, 1)
    return this.#api.delete(job).then(() => this.#storage.save(updatedJobs))
  }
}

export function createBaktaService(baktaApi: BaktaApi, storage?: BaktaJobStorage) {
  return new BaktaServiceImpl(baktaApi, storage)
}
