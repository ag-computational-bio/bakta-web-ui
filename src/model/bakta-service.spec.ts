import { describe, expect, it, vi } from 'vitest'
import type { BaktaJobStorage } from './storage/local-job-storage'
import type { Job, JobResult } from './job'
import { createBaktaApi, type BaktaApi } from './bakta-api'
import type { FailedJobInfo, JobInfo, JobStatus, ListResponse } from './submit'
import { createBaktaService } from './bakta-service'

class SimpleJobStorage implements BaktaJobStorage {
  jobs: Job[] = []

  key(j: Job): string {
    return j.jobID
  }

  get(): Job[] {
    return this.jobs
  }

  save(jobs: Job[]): void {
    this.jobs = jobs
  }
}

function failed(id: string): FailedJobInfo {
  return { jobID: id, jobStatus: 'NOT_FOUND' }
}
function job(id: string, status: JobStatus = 'ERROR'): JobInfo {
  return {
    jobID: id,
    jobStatus: status,
    name: id,
    started: new Date().toISOString(),
    updated: new Date().toISOString(),
  }
}

function mockedListJobs(jobs: (FailedJobInfo | JobInfo)[]): (jobs: Job[]) => Promise<ListResponse> {
  return (req) => {
    const out: ListResponse = { failedJobs: [], jobs: [] }
    for (const j of req) {
      const idx = jobs.findIndex((x) => x.jobID === j.jobID)
      if (idx >= 0) {
        const job = jobs[idx]
        if (job.jobStatus === 'NOT_FOUND') out.failedJobs.push(job)
        else out.jobs.push(job as JobInfo)
      }
    }
    return Promise.resolve(out)
  }
}

const fixtures = {
  A: { jobID: 'A', secret: 'A' },
  B: { jobID: 'B', secret: 'B' },
  C: { jobID: 'C', secret: 'C' },
}

describe('bakta service', () => {
  describe('list jobs', async () => {
    it('should retrieve data with key for stored job ids', async () => {
      const storage = new SimpleJobStorage()
      storage.save([fixtures.A, fixtures.B])
      const api: BaktaApi = createBaktaApi('')
      const jobInfoFixtures = [job('A'), job('C'), job('B')]
      api.listJob = vi.fn().mockImplementation(mockedListJobs(jobInfoFixtures))
      const service = createBaktaService(api, storage)
      const jobs = await service.listJobs()
      expect(jobs).to.deep.equal([
        { ...jobInfoFixtures[0], key: 'A' },
        { ...jobInfoFixtures[2], key: 'B' },
      ])
    })
    it('should not make an api call and return empty list when no job ids are stored', async () => {
      const storage = new SimpleJobStorage()
      const api: BaktaApi = createBaktaApi('')
      const mocked = vi.fn()
      api.listJob = mocked
      const service = createBaktaService(api, storage)
      const jobs = await service.listJobs()
      expect(jobs).to.deep.equal([])
      expect(mocked).not.toHaveBeenCalled()
    })
  })

  describe('remove outdated jobs', () => {
    it('should remove "NOT_FOUND" jobs', async () => {
      const storage = new SimpleJobStorage()
      storage.save([fixtures.A, fixtures.B, fixtures.C])

      const api: BaktaApi = createBaktaApi('')
      api.listJob = vi.fn().mockImplementation(mockedListJobs([failed('A'), failed('C'), job('B')]))
      const service = createBaktaService(api, storage)
      await service.removeOutdatedJobs()
      expect(storage.jobs).to.deep.equal([fixtures.B])
    })
    it('should remove nothing when no "NOT_FOUND" jobs are present', async () => {
      const storage = new SimpleJobStorage()
      storage.save([fixtures.A, fixtures.B, fixtures.C])

      const api: BaktaApi = createBaktaApi('')
      api.listJob = vi
        .fn()
        .mockImplementation(mockedListJobs([job('A'), job('C'), job('B', 'ERROR')]))
      const service = createBaktaService(api, storage)
      await service.removeOutdatedJobs()
      expect(storage.jobs).to.deep.equal([fixtures.A, fixtures.B, fixtures.C])
    })
  })

  describe('remove job', () => {
    it('should make api call when job exists in storage', async () => {
      const storage = new SimpleJobStorage()
      storage.save([fixtures.A])
      const api: BaktaApi = createBaktaApi('')
      const mock = vi.fn().mockImplementation(() => {})
      api.delete = mock
      const service = createBaktaService(api, storage)
      await service.removeJob('A')
      expect(mock).toHaveBeenCalledOnce()
    })
    it('should fail when job does not exist in storage', async () => {
      const storage = new SimpleJobStorage()
      const api: BaktaApi = createBaktaApi('')
      const service = createBaktaService(api, storage)
      await expect(service.removeJob('A')).rejects.toThrow()
    })
  })

  describe('job', () => {
    const storage = new SimpleJobStorage()
    it('should make api call and pass the jobinfo to the caller', async () => {
      const api: BaktaApi = createBaktaApi('')
      const mock = vi.fn(api.listJob).mockResolvedValue({ failedJobs: [], jobs: [job('A')] })
      api.listJob = mock
      const service = createBaktaService(api, storage)
      await expect(service.job(fixtures.A)).resolves.to.deep.eq(job('A'))
      expect(mock).toHaveBeenCalledOnce()
      expect(mock).toHaveBeenCalledWith([fixtures.A])
    })
    it('should make api call and fail when the job does not exist', async () => {
      const api: BaktaApi = createBaktaApi('')
      const mock = vi.fn(api.listJob).mockResolvedValue({ failedJobs: [failed('A')], jobs: [] })
      api.listJob = mock
      const service = createBaktaService(api, storage)
      await expect(service.job(fixtures.A)).rejects.toThrow()
      expect(mock).toHaveBeenCalledOnce()
      expect(mock).toHaveBeenCalledWith([fixtures.A])
    })
  })

  describe('result', () => {
    const storage = new SimpleJobStorage()
    it('should make api call and pass the result to the caller', async () => {
      const api: BaktaApi = createBaktaApi('')
      const res: JobResult = {
        jobID: 'A',
        name: 'A',
        ResultFiles: {},
        started: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      const mock = vi.fn(api.jobResult).mockResolvedValue(res)
      api.jobResult = mock
      const service = createBaktaService(api, storage)
      await expect(service.result(fixtures.A)).resolves.to.deep.equal(res)
      expect(mock).toHaveBeenCalledOnce()
      expect(mock).toHaveBeenCalledWith(fixtures.A)
    })
    it('should make api call and pass the error to the caller', async () => {
      const api: BaktaApi = createBaktaApi('')

      const mock = vi.fn(api.jobResult).mockRejectedValue('failed')
      api.jobResult = mock
      const service = createBaktaService(api, storage)
      await expect(service.result(fixtures.A)).rejects.toThrow()
      expect(mock).toHaveBeenCalledOnce()
      expect(mock).toHaveBeenCalledWith(fixtures.A)
    })
  })
})
