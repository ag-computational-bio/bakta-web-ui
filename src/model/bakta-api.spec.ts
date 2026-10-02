import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBaktaApi } from './bakta-api'
import type { Job } from './job'

const job: Job = {
  jobID: 'job-1',
  secret: 'secret-1',
}

const started = '2026-04-02T00:00:00.000Z'
const updated = '2026-04-02T00:00:01.000Z'

type ResultKind = 'bakta' | 'bakta_proteins' | 'baktfold'

function resultPayload(resultKind: ResultKind, files: Record<string, unknown>) {
  return {
    job_id: job.jobID,
    workflow_kind: resultKind,
    started,
    updated,
    name: 'Example result',
    result: {
      result_kind: resultKind,
      files,
    },
  }
}

function mockFetchJson(payload: unknown): void {
  vi.spyOn(window, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('initJob', () => {
  it.each([undefined, { 'Content-Type': 'application/octet-stream' }])(
    'preserves returned upload headers %j',
    async (headers) => {
      mockFetchJson({
        job: { job_id: job.jobID, secret: job.secret },
        workflow_kind: 'bakta',
        uploads: [{ upload_kind: 'genome_fasta', required: true, url: '/upload', headers }],
      })
      const response = await createBaktaApi('/api').initJob({ name: 'test', workflowKind: 'bakta' })
      expect(response.uploads[0].headers).toEqual(headers)
    },
  )
})

describe('jobResult', () => {
  it('accepts bakta results with only json and available optional files', async () => {
    mockFetchJson(
      resultPayload('bakta', {
        json: ' /result.json ',
        faa: '/result.faa',
      }),
    )

    const api = createBaktaApi('/api')

    await expect(api.jobResult(job)).resolves.toEqual({
      jobID: job.jobID,
      workflowKind: 'bakta',
      resultKind: 'bakta',
      name: 'Example result',
      started,
      updated,
      ResultFiles: {
        JSON: '/result.json',
        FAA: '/result.faa',
      },
    })
  })

  it('drops blank optional file urls from bakta proteins results', async () => {
    mockFetchJson(
      resultPayload('bakta_proteins', {
        json: '/proteins.json',
        tsv: '',
        faa: '   ',
        hypotheticals_tsv: '/hypotheticals.tsv',
      }),
    )

    const api = createBaktaApi('/api')

    await expect(api.jobResult(job)).resolves.toEqual({
      jobID: job.jobID,
      workflowKind: 'bakta_proteins',
      resultKind: 'bakta_proteins',
      name: 'Example result',
      started,
      updated,
      ResultFiles: {
        JSON: '/proteins.json',
        TSVHypothetical: '/hypotheticals.tsv',
      },
    })
  })

  it.each(['bakta', 'bakta_proteins', 'baktfold'] as const)(
    'requires a json result file for %s results',
    async (resultKind) => {
      mockFetchJson(resultPayload(resultKind, {}))

      const api = createBaktaApi('/api')

      await expect(api.jobResult(job)).rejects.toThrow()
    },
  )

  it.each(['bakta', 'bakta_proteins', 'baktfold'] as const)(
    'rejects blank json result files for %s results',
    async (resultKind) => {
      mockFetchJson(resultPayload(resultKind, { json: '   ' }))

      const api = createBaktaApi('/api')

      await expect(api.jobResult(job)).rejects.toThrow()
    },
  )
})
