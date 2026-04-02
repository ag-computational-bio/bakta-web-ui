import { z } from 'zod'
import {
  JobResultSchema,
  normalizeResultFileUrl,
  type Job,
  type JobResult,
  type ResultFiles,
} from './job'
import {
  InitResponseSchema,
  ListResponseSchema,
  WorkflowDescriptorSchema,
  WorkflowLogsSchema,
  type DermType,
  type FailedJobStatus,
  type InitRequest,
  type InitResponse,
  type JobConfig,
  type JobStatus,
  type ListResponse,
  type StartRequest,
  type WorkflowDescriptor,
  type WorkflowLogs,
} from './submit'
import { VersionSchema, type Version } from './Version'

const WorkflowKindSchema = z.enum(['bakta', 'bakta_baktfold', 'bakta_proteins', 'baktfold'])
const ResultKindSchema = z.enum(['bakta', 'bakta_proteins', 'baktfold'])
const UploadKindSchema = z.enum([
  'genome_fasta',
  'prodigal_training_file',
  'replicons_table',
  'regions_file',
  'trusted_proteins_file',
  'hmms_file',
  'protein_fasta',
  'bakta_json',
])

const ApiJobReferenceSchema = z.object({
  secret: z.string(),
  job_id: z.string(),
})

const ApiInitResponseSchema = z.object({
  job: ApiJobReferenceSchema,
  workflow_kind: WorkflowKindSchema,
  uploads: z.array(
    z.object({
      upload_kind: UploadKindSchema,
      required: z.boolean(),
      url: z.string(),
    }),
  ),
})

const ApiJobStatusSchema = z.enum(['init', 'running', 'successful', 'error'])
const ApiFailedJobStatusSchema = z.enum(['not_found', 'unauthorized'])

const ApiListResponseSchema = z.object({
  jobs: z.array(
    z.object({
      job_id: z.string(),
      status: ApiJobStatusSchema,
      workflow_kind: WorkflowKindSchema,
      result_kind: ResultKindSchema,
      started: z.string(),
      updated: z.string(),
      name: z.string(),
    }),
  ),
  failed_jobs: z.array(
    z.object({
      job_id: z.string(),
      status: ApiFailedJobStatusSchema,
    }),
  ),
})

const ApiRequiredResultFileUrlSchema = z.preprocess(normalizeResultFileUrl, z.string())
const ApiOptionalResultFileUrlSchema = z.preprocess(normalizeResultFileUrl, z.string().optional())

const ApiBaktaResultFilesSchema = z.object({
  embl: ApiOptionalResultFileUrlSchema,
  faa: ApiOptionalResultFileUrlSchema,
  hypotheticals_faa: ApiOptionalResultFileUrlSchema,
  ffn: ApiOptionalResultFileUrlSchema,
  fna: ApiOptionalResultFileUrlSchema,
  gbff: ApiOptionalResultFileUrlSchema,
  gff3: ApiOptionalResultFileUrlSchema,
  json: ApiRequiredResultFileUrlSchema,
  tsv: ApiOptionalResultFileUrlSchema,
  hypotheticals_tsv: ApiOptionalResultFileUrlSchema,
  logs_txt: ApiOptionalResultFileUrlSchema,
  inference_tsv: ApiOptionalResultFileUrlSchema,
  circular_plot_png: ApiOptionalResultFileUrlSchema,
  circular_plot_svg: ApiOptionalResultFileUrlSchema,
})

const ApiBaktaProteinsResultFilesSchema = z.object({
  tsv: ApiOptionalResultFileUrlSchema,
  faa: ApiOptionalResultFileUrlSchema,
  hypotheticals_tsv: ApiOptionalResultFileUrlSchema,
  json: ApiRequiredResultFileUrlSchema,
})

const ApiBaktfoldResultFilesSchema = z.object({
  embl: ApiOptionalResultFileUrlSchema,
  faa: ApiOptionalResultFileUrlSchema,
  hypotheticals_faa: ApiOptionalResultFileUrlSchema,
  ffn: ApiOptionalResultFileUrlSchema,
  fna: ApiOptionalResultFileUrlSchema,
  gbff: ApiOptionalResultFileUrlSchema,
  gff3: ApiOptionalResultFileUrlSchema,
  json: ApiRequiredResultFileUrlSchema,
  tsv: ApiOptionalResultFileUrlSchema,
  hypotheticals_tsv: ApiOptionalResultFileUrlSchema,
  logs_txt: ApiOptionalResultFileUrlSchema,
  inference_tsv: ApiOptionalResultFileUrlSchema,
})

function appendResultFile(
  resultFiles: ResultFiles,
  key: keyof ResultFiles,
  url: string | undefined,
): void {
  if (url) resultFiles[key] = url
}

const ApiResultResponseSchema = z.object({
  job_id: z.string(),
  workflow_kind: WorkflowKindSchema,
  started: z.string(),
  updated: z.string(),
  name: z.string(),
  result: z.discriminatedUnion('result_kind', [
    z.object({ result_kind: z.literal('bakta'), files: ApiBaktaResultFilesSchema }),
    z.object({
      result_kind: z.literal('bakta_proteins'),
      files: ApiBaktaProteinsResultFilesSchema,
    }),
    z.object({ result_kind: z.literal('baktfold'), files: ApiBaktfoldResultFilesSchema }),
  ]),
})

const ApiLogsResponseSchema = z.object({
  workflow_kind: WorkflowKindSchema,
  stages: z.array(
    z.object({
      stage: z.string(),
      status: z.enum(['pending', 'running', 'succeeded', 'failed', 'error', 'unknown']),
      content: z.string(),
    }),
  ),
})

const ApiWorkflowDescriptorSchema = z.object({
  workflow_kind: WorkflowKindSchema,
  result_kind: ResultKindSchema,
  uploads: z.array(
    z.object({
      upload_kind: UploadKindSchema,
      required: z.boolean(),
    }),
  ),
  stages: z.array(z.string()),
})

const ApiVersionSchema = z.object({
  backend_version: z.string(),
  bakta_version: z.string(),
  bakta_db_version: z.string(),
  baktfold_version: z.string(),
  baktfold_db_version: z.string(),
})

export interface BaktaApi {
  delete(j: Job): Promise<void>
  initJob(req: InitRequest): Promise<InitResponse>
  listJob(req: Job[]): Promise<ListResponse>
  jobResult(req: Job): Promise<JobResult>
  startJob(req: StartRequest): Promise<void>
  getVersions(): Promise<Version>
  jobLogs(j: Job): Promise<WorkflowLogs>
  getWorkflows(): Promise<WorkflowDescriptor[]>
}

let instance: BaktaApi

type ApiBaktaConfig = {
  use_prodigal_training_file: boolean
  use_replicons: boolean
  use_regions: boolean
  use_trusted_proteins: boolean
  use_hmms: boolean
  translation_table: number
  complete_genome: boolean
  keep_contig_headers: boolean
  min_contig_length: number
  derm_type: 'unknown' | 'monoderm' | 'diderm'
  genus: string | null
  species: string | null
  strain: string | null
  plasmid: string | null
  locus: string | null
  locus_tag: string | null
  locus_tag_increment: number
  compliant: boolean
  meta: boolean
  skip_trna: boolean
  skip_tmrna: boolean
  skip_rrna: boolean
  skip_ncrna: boolean
  skip_ncrna_region: boolean
  skip_crispr: boolean
  skip_cds: boolean
  skip_pseudo: boolean
  skip_sorf: boolean
  skip_gap: boolean
  skip_ori: boolean
  skip_filter: boolean
  skip_plot: boolean
}

class BaktaApiImpl implements BaktaApi {
  baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async #readBody(response: Response): Promise<unknown> {
    const text = await response.text()
    if (text.length === 0) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  async #request(method: string, url: string, body?: unknown): Promise<unknown> {
    const response = await window.fetch(url, {
      method,
      headers:
        body == undefined
          ? { Accept: 'application/json' }
          : {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
      body: body == undefined ? undefined : JSON.stringify(body),
    })

    const payload = await this.#readBody(response)
    if (response.ok) return payload
    if (typeof payload === 'string') throw payload
    throw `${response.status} ${response.statusText}`
  }

  #jobReference(job: Job) {
    return { job_id: job.jobID, secret: job.secret }
  }

  #jobStatus(status: z.infer<typeof ApiJobStatusSchema>): JobStatus {
    switch (status) {
      case 'init':
        return 'INIT'
      case 'running':
        return 'RUNNING'
      case 'successful':
        return 'SUCCESSFUL'
      case 'error':
        return 'ERROR'
    }
  }

  #failedJobStatus(status: z.infer<typeof ApiFailedJobStatusSchema>): FailedJobStatus {
    switch (status) {
      case 'not_found':
        return 'NOT_FOUND'
      case 'unauthorized':
        return 'UNAUTHORIZED'
    }
  }

  #dermType(type: DermType): ApiBaktaConfig['derm_type'] {
    switch (type) {
      case 'MONODERM':
        return 'monoderm'
      case 'DIDERM':
        return 'diderm'
      case 'UNKNOWN':
        return 'unknown'
    }
  }

  #baktaConfig(config: JobConfig): ApiBaktaConfig {
    return {
      use_prodigal_training_file: config.useProdigalTrainingFile,
      use_replicons: config.useReplicons,
      use_regions: config.useRegions,
      use_trusted_proteins: config.useTrustedProteins,
      use_hmms: config.useHmms,
      translation_table: config.translationTable,
      complete_genome: config.completeGenome,
      keep_contig_headers: config.keepContigHeaders,
      min_contig_length: config.minContigLength,
      derm_type: this.#dermType(config.dermType),
      genus: config.genus,
      species: config.species,
      strain: config.strain,
      plasmid: config.plasmid,
      locus: config.locus,
      locus_tag: config.locusTag,
      locus_tag_increment: config.locusTagIncrement,
      compliant: config.compliant,
      meta: config.meta,
      skip_trna: config.skipTrna,
      skip_tmrna: config.skipTmrna,
      skip_rrna: config.skipRrna,
      skip_ncrna: config.skipNcrna,
      skip_ncrna_region: config.skipNcrnaRegion,
      skip_crispr: config.skipCrispr,
      skip_cds: config.skipCds,
      skip_pseudo: config.skipPseudo,
      skip_sorf: config.skipSorf,
      skip_gap: config.skipGap,
      skip_ori: config.skipOri,
      skip_filter: config.skipFilter,
      skip_plot: config.skipPlot,
    }
  }

  #resultFiles(result: z.infer<typeof ApiResultResponseSchema>['result']): ResultFiles {
    switch (result.result_kind) {
      case 'bakta': {
        const files: ResultFiles = { JSON: result.files.json }
        appendResultFile(files, 'EMBL', result.files.embl)
        appendResultFile(files, 'FAA', result.files.faa)
        appendResultFile(files, 'FAAHypothetical', result.files.hypotheticals_faa)
        appendResultFile(files, 'FFN', result.files.ffn)
        appendResultFile(files, 'FNA', result.files.fna)
        appendResultFile(files, 'GBFF', result.files.gbff)
        appendResultFile(files, 'GFF3', result.files.gff3)
        appendResultFile(files, 'TSV', result.files.tsv)
        appendResultFile(files, 'TSVHypothetical', result.files.hypotheticals_tsv)
        appendResultFile(files, 'TSVInference', result.files.inference_tsv)
        appendResultFile(files, 'TXTLogs', result.files.logs_txt)
        appendResultFile(files, 'PNGCircularPlot', result.files.circular_plot_png)
        appendResultFile(files, 'SVGCircularPlot', result.files.circular_plot_svg)
        return files
      }
      case 'bakta_proteins': {
        const files: ResultFiles = { JSON: result.files.json }
        appendResultFile(files, 'TSV', result.files.tsv)
        appendResultFile(files, 'FAA', result.files.faa)
        appendResultFile(files, 'TSVHypothetical', result.files.hypotheticals_tsv)
        return files
      }
      case 'baktfold': {
        const files: ResultFiles = { JSON: result.files.json }
        appendResultFile(files, 'EMBL', result.files.embl)
        appendResultFile(files, 'FAA', result.files.faa)
        appendResultFile(files, 'FAAHypothetical', result.files.hypotheticals_faa)
        appendResultFile(files, 'FFN', result.files.ffn)
        appendResultFile(files, 'FNA', result.files.fna)
        appendResultFile(files, 'GBFF', result.files.gbff)
        appendResultFile(files, 'GFF3', result.files.gff3)
        appendResultFile(files, 'TSV', result.files.tsv)
        appendResultFile(files, 'TSVHypothetical', result.files.hypotheticals_tsv)
        appendResultFile(files, 'TSVInference', result.files.inference_tsv)
        appendResultFile(files, 'TXTLogs', result.files.logs_txt)
        return files
      }
    }
  }

  async initJob(req: InitRequest): Promise<InitResponse> {
    const payload = ApiInitResponseSchema.parse(
      await this.#request('POST', this.baseUrl + '/job/init', {
        name: req.name,
        workflow_kind: req.workflowKind,
      }),
    )

    return InitResponseSchema.parse({
      job: {
        jobID: payload.job.job_id,
        secret: payload.job.secret,
        workflowKind: payload.workflow_kind,
      },
      workflowKind: payload.workflow_kind,
      uploads: payload.uploads.map((upload) => ({
        uploadKind: upload.upload_kind,
        required: upload.required,
        url: upload.url,
      })),
    })
  }

  async listJob(req: Job[]): Promise<ListResponse> {
    const payload = ApiListResponseSchema.parse(
      await this.#request('POST', this.baseUrl + '/job/list', {
        jobs: req.map((job) => this.#jobReference(job)),
      }),
    )

    return ListResponseSchema.parse({
      jobs: payload.jobs.map((job) => ({
        jobID: job.job_id,
        jobStatus: this.#jobStatus(job.status),
        name: job.name,
        started: job.started,
        updated: job.updated,
        workflowKind: job.workflow_kind,
        resultKind: job.result_kind,
      })),
      failedJobs: payload.failed_jobs.map((job) => ({
        jobID: job.job_id,
        jobStatus: this.#failedJobStatus(job.status),
      })),
    })
  }

  async jobResult(req: Job): Promise<JobResult> {
    const payload = ApiResultResponseSchema.parse(
      await this.#request('POST', this.baseUrl + '/job/result', this.#jobReference(req)),
    )

    return JobResultSchema.parse({
      jobID: payload.job_id,
      workflowKind: payload.workflow_kind,
      resultKind: payload.result.result_kind,
      name: payload.name,
      started: payload.started,
      updated: payload.updated,
      ResultFiles: this.#resultFiles(payload.result),
    })
  }

  async jobLogs(job: Job): Promise<WorkflowLogs> {
    const payload = ApiLogsResponseSchema.parse(
      await this.#request(
        'GET',
        this.baseUrl + `/job/logs?job_id=${job.jobID}&secret=${job.secret}`,
      ),
    )

    return WorkflowLogsSchema.parse({
      workflowKind: payload.workflow_kind,
      stages: payload.stages,
    })
  }

  async startJob(req: StartRequest): Promise<void> {
    let config: ApiBaktaConfig | Record<string, never> = {}
    if (req.workflowKind === 'bakta' || req.workflowKind === 'bakta_baktfold') {
      if (!req.config) throw 'Missing Bakta job configuration'
      config = this.#baktaConfig(req.config)
    }

    await this.#request('POST', this.baseUrl + '/job/start', {
      job: this.#jobReference(req.job),
      workflow_kind: req.workflowKind,
      config,
    })
  }

  async getVersions(): Promise<Version> {
    const payload = ApiVersionSchema.parse(await this.#request('GET', this.baseUrl + '/version'))
    return VersionSchema.parse({
      backendVersion: payload.backend_version,
      baktaVersion: payload.bakta_version,
      baktaDbVersion: payload.bakta_db_version,
      baktfoldVersion: payload.baktfold_version,
      baktfoldDbVersion: payload.baktfold_db_version,
    })
  }

  async getWorkflows(): Promise<WorkflowDescriptor[]> {
    const payload = z
      .array(ApiWorkflowDescriptorSchema)
      .parse(await this.#request('GET', this.baseUrl + '/workflows'))

    return z.array(WorkflowDescriptorSchema).parse(
      payload.map((workflow) => ({
        workflowKind: workflow.workflow_kind,
        resultKind: workflow.result_kind,
        uploads: workflow.uploads.map((upload) => ({
          uploadKind: upload.upload_kind,
          required: upload.required,
        })),
        stages: workflow.stages,
      })),
    )
  }

  async delete(job: Job): Promise<void> {
    await this.#request(
      'DELETE',
      this.baseUrl + `/job/delete?job_id=${job.jobID}&secret=${job.secret}`,
    )
  }
}

export function createBaktaApi(url: string): BaktaApi {
  return new BaktaApiImpl(url)
}

/**
 * Initializes the global bakta-api. Must be called before useBaktaApi is used.
 *
 * @param url The base url of the api, e.g. https://api.bakta.computational.bio/api/v2
 * @returns The created bakta api instance
 */
export function initBaktaApi(url: string): BaktaApi {
  if (instance == undefined) instance = new BaktaApiImpl(url)
  return instance
}

/**
 * Retrieves the bakta-api, if initialized. Throws an error otherwise.
 */
export function useBaktaApi(): BaktaApi {
  if (instance == undefined) throw 'Bakta api is not initialized'
  return instance
}
