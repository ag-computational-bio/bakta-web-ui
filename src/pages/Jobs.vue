<template>
  <div class="container flex-grow-1">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Id</th>
          <th>Jobname</th>
          <th>Submission</th>
          <th>Last updated</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody v-if="!loading">
        <tr v-for="item in jobs" :key="item.key">
          <td>{{ item.jobID }}</td>
          <td>{{ item.name }}</td>
          <td>{{ formatDateTime(item.started) }}</td>
          <td>{{ formatDateTime(item.updated) }}</td>
          <td>{{ formatState(item.jobStatus) }}</td>
          <td>
            <router-link v-if="isSuccessful(item)" :to="{ name: 'Job', params: { id: item.key } }">
              Link
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!hasJobs">No jobs found</div>

    <div v-if="hasNotFound" class="d-flex flex-row-reverse row-cols-lg-auto align-items-end">
      <div class="col-12">
        <div class="col-12">
          <button class="btn btn-secondary" @click="udpateJobs(true)">
            Remove outdated jobs from list
          </button>
        </div>
      </div>
    </div>

    <div class="row d-flex justify-content-center" v-if="loading">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Job } from '@/model/job'
import type { FailedJobInfo, FailedJobStatus, JobInfo, JobStatus } from '@/model/submit'

const jobs = ref<(JobInfo | FailedJobInfo)[]>([])
const pollInterval = 5000
const hideLocalJobs = ref(false)
const loading = ref(false)
let timeout: number | null = null

const hasJobs = computed(() => jobs.value.length > 0)
const hasNotFound = computed(() => jobs.value.some((j) => j.jobStatus === 'NOT_FOUND'))

function formatState(state: JobStatus | FailedJobStatus): string {
  switch (state) {
    case 'NOT_FOUND':
      return 'OUTDATED'
  }
  return state
}

function formatDateTime(datestring: string): string {
  if (datestring) {
    try {
      const date = Date.parse(datestring)
      return new Intl.DateTimeFormat([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    } catch (err) {
      return `Unable to format: '${datestring}'. Error: ${err}`
    }
  } else {
    return ''
  }
}

function isSuccessful(job: JobInfo | FailedJobInfo): boolean {
  return job.jobStatus === 'SUCCESSFULL'
}

function planRefresh() {
  if (
    jobs.value.every(
      (j) =>
        isSuccessful(j) ||
        j.jobStatus === 'ERROR' ||
        j.jobStatus === 'UNAUTHORIZED' ||
        j.jobStatus === 'NOT_FOUND',
    )
  ) {
    // all jobs are in finished state. No polling needed anymore
    console.debug('All jobs finished or failed, no need to refresh', jobs.value)
    timeout = null
  } else {
    if (timeout) {
      console.debug('Job lookup already scheduled. Canceling', timeout)
      window.clearTimeout(timeout)
    }
    console.debug('Jobs still running, need to refresh', jobs.value)
    // trigger reload
    timeout = window.setTimeout(() => {
      timeout = null
      updateJobs()
    }, pollInterval)
  }
}

function cancelRefresh() {
  if (timeout) {
    window.clearTimeout(timeout)
  }
}

function updateJobs() {
  loading.value = true
  bakta.jobs(!hideLocalJobs, deleteUnknown).then((x) => {
    jobs = x.sort((a, b) => new Date(b.started).valueOf() - new Date(a.started).valueOf())
    planRefresh()
    loading = false
  })
}

onMounted(() => {
  updateJobs()
})

onUnmounted(() => {
  cancelRefresh()
})
</script>
