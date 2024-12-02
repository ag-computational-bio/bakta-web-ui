import { z, ZodType } from 'zod'
import type { Job } from '../job'

export interface BaktaJobStorage {
  save(jobs: Job[]): void
  get(): Job[]
  key(j: Job): string
}

const SavedJobsSchema = z.array(z.string())
const JobSchema: ZodType<Job> = z.object({
  jobID: z.string(),
  secret: z.string(),
})

function jobKey(job: Job) {
  return btoa(JSON.stringify({ jobID: job.jobID, secret: job.secret }))
}

function loadJobs(): Job[] {
  const jobsEl = window.localStorage.getItem('bakta-jobs')
  if (jobsEl == null) return []
  const jobs = SavedJobsSchema.parse(JSON.parse(jobsEl))
  const parsed: Job[] = jobs.map((x) => JobSchema.parse(JSON.parse(atob(x))))
  return parsed
}
function saveJobs(jobs: Job[]) {
  const toPersist = jobs.map((j) => jobKey(j))
  window.localStorage.setItem('bakta-jobs', JSON.stringify(Array.from(new Set(toPersist))))
}

export function useJobStorage(): BaktaJobStorage {
  return { save: saveJobs, get: loadJobs, key: jobKey }
}
