import { z } from 'zod'
import { JobSchema, type Job } from '../job'

export interface BaktaJobStorage {
  save(jobs: Job[]): void
  get(): Job[]
  key(j: Job): string
}

const SavedJobsSchema = z.array(z.string())

function persistableJob(job: Job): Job {
  if (job.workflowKind) return job
  return { jobID: job.jobID, secret: job.secret }
}

function jobIdentity(job: Job): string {
  return `${job.jobID}:${job.secret}`
}

function dedupeJobs(jobs: Job[]): Job[] {
  const uniqueJobs = new Map<string, Job>()
  for (const job of jobs) {
    const key = jobIdentity(job)
    const existing = uniqueJobs.get(key)
    if (!existing || (job.workflowKind && !existing.workflowKind)) {
      uniqueJobs.set(key, persistableJob(job))
    }
  }
  return Array.from(uniqueJobs.values())
}

function jobKey(job: Job): string {
  return btoa(JSON.stringify(persistableJob(job)))
}

function loadJobs(): Job[] {
  const jobsEl = window.localStorage.getItem('bakta-jobs')
  if (jobsEl == null) return []
  const jobs = SavedJobsSchema.parse(JSON.parse(jobsEl))
  return dedupeJobs(jobs.map((x) => JobSchema.parse(JSON.parse(atob(x)))))
}

function saveJobs(jobs: Job[]) {
  const toPersist = dedupeJobs(jobs).map((job) => jobKey(job))
  window.localStorage.setItem('bakta-jobs', JSON.stringify(toPersist))
}

export function useJobStorage(): BaktaJobStorage {
  return { save: saveJobs, get: loadJobs, key: jobKey }
}
