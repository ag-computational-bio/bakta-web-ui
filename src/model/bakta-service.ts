import type { BaktaApi } from './bakta-api'
import type { Job, JobResult, WorkflowKind } from './job'
import { useJobStorage, type BaktaJobStorage } from './storage/local-job-storage'
import type {
  FailedJobInfo,
  JobConfig,
  JobInfo,
  UploadLink,
  WorkflowDescriptor,
  WorkflowLogs,
} from './submit'

export type Replicon = {
  id: string
  length: number
  new: string
  name: string
  type: string
  topology: string
}

export type BaktaJobRequest = {
  workflowKind: 'bakta' | 'bakta_baktfold'
  jobName: string
  sequence: string
  prodigalTrainingFile: File | null
  regionsFile: File | null
  trustedProteinsFile: File | null
  hmmsFile: File | null
  replicons: Replicon[]
  config: JobConfig
}

export type BaktaProteinsJobRequest = {
  workflowKind: 'bakta_proteins'
  jobName: string
  proteinFasta: File | null
}

export type BaktfoldJobRequest = {
  workflowKind: 'baktfold'
  jobName: string
  baktaJson: File | null
}

export type SubmitJobRequest = BaktaJobRequest | BaktaProteinsJobRequest | BaktfoldJobRequest

function createJobConfig(init?: Partial<JobConfig>): JobConfig {
  return {
    useProdigalTrainingFile: false,
    useReplicons: false,
    useRegions: false,
    useTrustedProteins: false,
    useHmms: false,
    completeGenome: false,
    compliant: false,
    dermType: 'UNKNOWN',
    genus: '',
    species: '',
    strain: '',
    plasmid: '',
    keepContigHeaders: false,
    locus: '',
    locusTag: '',
    locusTagIncrement: 1,
    meta: false,
    minContigLength: 1,
    translationTable: 11,
    skipTrna: false,
    skipTmrna: false,
    skipRrna: false,
    skipNcrna: false,
    skipNcrnaRegion: false,
    skipCrispr: false,
    skipCds: false,
    skipPseudo: false,
    skipSorf: false,
    skipGap: false,
    skipOri: false,
    skipFilter: false,
    skipPlot: false,
    ...init,
  }
}

export function createBaktaJobRequest(init?: Partial<BaktaJobRequest>): BaktaJobRequest {
  return {
    workflowKind: 'bakta',
    jobName: '',
    sequence: '',
    prodigalTrainingFile: null,
    regionsFile: null,
    trustedProteinsFile: null,
    hmmsFile: null,
    replicons: [],
    ...init,
    config: createJobConfig(init?.config),
  }
}

export function createBaktaProteinsJobRequest(
  init?: Partial<BaktaProteinsJobRequest>,
): BaktaProteinsJobRequest {
  return {
    workflowKind: 'bakta_proteins',
    jobName: '',
    proteinFasta: null,
    ...init,
  }
}

export function createBaktfoldJobRequest(init?: Partial<BaktfoldJobRequest>): BaktfoldJobRequest {
  return {
    workflowKind: 'baktfold',
    jobName: '',
    baktaJson: null,
    ...init,
  }
}

export type JobList = ((FailedJobInfo | JobInfo) & { key: string })[]

export interface BaktaService {
  submitJob(req: SubmitJobRequest): Promise<Job & { key: string }>
  workflows(): Promise<WorkflowDescriptor[]>
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
  logs(jobID: string): Promise<WorkflowLogs>
  logsForJob(job: Job): Promise<WorkflowLogs>
  /**
   * Checks if the provided job is in the joblist of this machine.
   * @param job
   */
  hasJob(job: Job): boolean
  /**
   * Adds the job to the joblist.
   * @param job
   */
  addJob(job: Job): void
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

  workflows(): Promise<WorkflowDescriptor[]> {
    return this.#api.getWorkflows()
  }

  logs(jobID: string): Promise<WorkflowLogs> {
    const jobs = this.#storage.get()
    const idx = jobs.findIndex((x) => x.jobID === jobID)
    if (idx < 0) return Promise.reject('Job not found')
    return this.#api.jobLogs(jobs[idx])
  }

  logsForJob(job: Job): Promise<WorkflowLogs> {
    return this.#api.jobLogs(job)
  }

  removeOutdatedJobs(): Promise<void> {
    const jobs = this.#storage.get()
    return this.listJobs().then((resp) => {
      const availableJobIds = new Set<string>()
      for (const job of resp) {
        if (job.jobStatus !== 'NOT_FOUND') availableJobIds.add(job.jobID)
      }
      this.#storage.save(jobs.filter((job) => availableJobIds.has(job.jobID)))
    })
  }

  async #upload(url: string | undefined, body: BodyInit | null | undefined): Promise<void> {
    if (body == undefined || body == null) return
    if (url == undefined) throw 'Missing upload URL'
    const response = await fetch(url, { method: 'PUT', body })
    if (!response.ok) throw 'Uploading input files failed'
  }

  #uploadUrl(uploads: UploadLink[], kind: string): string | undefined {
    return uploads.find((upload) => upload.uploadKind === kind)?.url
  }

  #persistJob(job: Job): Job & { key: string } {
    const jobs = this.#storage.get()
    jobs.push(job)
    this.#storage.save(jobs)
    return { ...job, key: this.#storage.key(job) }
  }

  #baktaConfig(request: BaktaJobRequest): JobConfig {
    return {
      ...request.config,
      useProdigalTrainingFile: request.prodigalTrainingFile != null,
      useReplicons: request.replicons.length > 0,
      useRegions: request.regionsFile != null,
      useTrustedProteins: request.trustedProteinsFile != null,
      useHmms: request.hmmsFile != null,
    }
  }

  async submitJob(request: SubmitJobRequest): Promise<Job & { key: string }> {
    const init = await this.#api.initJob({
      name: request.jobName,
      workflowKind: request.workflowKind,
    })

    switch (request.workflowKind) {
      case 'bakta':
      case 'bakta_baktfold': {
        if (request.sequence.length === 0) throw 'Genome FASTA is required'
        await Promise.all([
          this.#upload(this.#uploadUrl(init.uploads, 'genome_fasta'), request.sequence),
          this.#upload(
            this.#uploadUrl(init.uploads, 'replicons_table'),
            generateRepliconTable(request.replicons),
          ),
          this.#upload(
            this.#uploadUrl(init.uploads, 'prodigal_training_file'),
            request.prodigalTrainingFile,
          ),
          this.#upload(this.#uploadUrl(init.uploads, 'regions_file'), request.regionsFile),
          this.#upload(
            this.#uploadUrl(init.uploads, 'trusted_proteins_file'),
            request.trustedProteinsFile,
          ),
          this.#upload(this.#uploadUrl(init.uploads, 'hmms_file'), request.hmmsFile),
        ])
        await this.#api.startJob({
          job: init.job,
          workflowKind: request.workflowKind,
          config: this.#baktaConfig(request),
        })
        return this.#persistJob({ ...init.job, workflowKind: request.workflowKind })
      }
      case 'bakta_proteins': {
        if (request.proteinFasta == null) throw 'Protein FASTA is required'
        await this.#upload(this.#uploadUrl(init.uploads, 'protein_fasta'), request.proteinFasta)
        await this.#api.startJob({ job: init.job, workflowKind: request.workflowKind })
        return this.#persistJob({ ...init.job, workflowKind: request.workflowKind })
      }
      case 'baktfold': {
        if (request.baktaJson == null) throw 'Bakta JSON is required'
        await this.#upload(this.#uploadUrl(init.uploads, 'bakta_json'), request.baktaJson)
        await this.#api.startJob({ job: init.job, workflowKind: request.workflowKind })
        return this.#persistJob({ ...init.job, workflowKind: request.workflowKind })
      }
    }
  }

  listJobs(): Promise<JobList> {
    const allJobs = this.#storage.get()
    if (allJobs.length == 0) return Promise.resolve([])

    const jobIdx: Record<string, Job> = {}
    for (const job of allJobs) {
      jobIdx[job.jobID] = job
    }

    return this.#api.listJob(allJobs).then((response) => {
      let changed = false
      const storedJobs = allJobs.map((stored) => {
        const job = response.jobs.find((entry) => entry.jobID === stored.jobID)
        if (job?.workflowKind && stored.workflowKind !== job.workflowKind) {
          changed = true
          return { ...stored, workflowKind: job.workflowKind }
        }
        return stored
      })
      if (changed) {
        this.#storage.save(storedJobs)
        for (const job of storedJobs) jobIdx[job.jobID] = job
      }

      return [
        ...response.jobs.map((job) => ({ ...job, key: this.#storage.key(jobIdx[job.jobID]) })),
        ...response.failedJobs.map((job) => ({
          ...job,
          workflowKind: jobIdx[job.jobID]?.workflowKind,
          key: this.#storage.key(jobIdx[job.jobID]),
        })),
      ]
    })
  }

  hasJob(job: Job): boolean {
    return this.#storage
      .get()
      .some((stored) => stored.jobID === job.jobID && stored.secret === job.secret)
  }

  addJob(job: Job): void {
    const joblist = this.#storage.get()
    joblist.push(job)
    this.#storage.save(joblist)
  }

  job(job: Job): Promise<JobInfo> {
    return this.#api
      .listJob([job])
      .then((response) =>
        response.jobs.length > 0 ? response.jobs[0] : Promise.reject('Job not found'),
      )
  }

  result(job: Job): Promise<JobResult> {
    return this.#api.jobResult(job)
  }

  removeJob(jobID: string): Promise<void> {
    const jobs = this.#storage.get()
    const idx = jobs.findIndex((job) => job.jobID === jobID)
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

export function isBaktaJobRequest(request: SubmitJobRequest): request is BaktaJobRequest {
  return request.workflowKind === 'bakta' || request.workflowKind === 'bakta_baktfold'
}

export function workflowRouteName(
  workflowKind: WorkflowKind | undefined,
): 'JobBakta' | 'JobProteins' {
  if (workflowKind === 'bakta_proteins') return 'JobProteins'
  return 'JobBakta'
}
