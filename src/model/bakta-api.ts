import { JobResultSchema, type Job, type JobResult } from './job'
import {
  InitResponseSchema,
  ListResponseSchema,
  type InitRequest,
  type InitResponse,
  type ListResponse,
  type StartRequest,
} from './submit'
import { VersionSchema, type Version } from './Version'

export interface BaktaApi {
  delete(j: Job): Promise<void>
  initJob(req: InitRequest): Promise<InitResponse>
  listJob(req: Job[]): Promise<ListResponse>
  jobResult(req: Job): Promise<JobResult>
  startJob(req: StartRequest): Promise<void>
  getVersions(): Promise<Version>
  jobLogs(j: Job): Promise<string>
}

let instance: BaktaApi

class BaktaApiImpl implements BaktaApi {
  baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  #postJson(url: string, body: string): Promise<unknown> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    return window
      .fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      })
      .then((r) => {
        if (r.ok) return r.json()
        console.error('Request failed', r)
        throw 'Request failed'
      })
  }
  initJob(req: InitRequest): Promise<InitResponse> {
    return this.#postJson(this.baseUrl + '/job/init', JSON.stringify(req)).then((j) =>
      InitResponseSchema.parse(j),
    )
  }
  listJob(req: Job[]): Promise<ListResponse> {
    return this.#postJson(this.baseUrl + '/job/list', JSON.stringify({ jobs: req })).then((j) =>
      ListResponseSchema.parse(j),
    )
  }
  jobResult(req: Job): Promise<JobResult> {
    return this.#postJson(this.baseUrl + '/job/result', JSON.stringify(req)).then((j) =>
      JobResultSchema.parse(j),
    )
  }
  jobLogs(j: Job): Promise<string> {
    return fetch(this.baseUrl + `/job/logs?jobID=${j.jobID}&secret=${j.secret}`).then((r) =>
      r.text(),
    )
  }
  startJob(req: StartRequest): Promise<void> {
    return fetch(this.baseUrl + '/job/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    }).then((r) => {
      if (r.ok) return
      else throw 'Starting the job failed'
    })
  }
  getVersions(): Promise<Version> {
    return fetch(this.baseUrl + '/version', {})
      .then((r) => r.json())
      .then(VersionSchema.parse)
  }

  delete(j: Job): Promise<void> {
    return fetch(this.baseUrl + `/delete?jobID=${j.jobID}&secret=${j.secret}`, {
      method: 'DELETE',
    }).then((x) => {
      console.log(x.status)
      if (x.ok || x.status == 404) return Promise.resolve()
      return Promise.reject('Deletion failed')
    })
  }
}

export function createBaktaApi(url: string): BaktaApi {
  return new BaktaApiImpl(url)
}

/**
 * Initializes the global bakta-api. Must be called before useBaktaApi is used.
 *
 * @param url The base url of the api, e.g. https://api.bakta.computational.bio/api/v1/
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
