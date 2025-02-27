<template>
  <div class="container flex-grow-1">
    <Notification v-if="error" class="mb-2" type="warning" :message="error" />
    <template v-if="log == undefined">
      <div class="alert alert-secondary mb-2" v-if="polling">
        Automatically updating job list
        <div v-if="loading" class="spinner-border spinner-border-sm text-secondary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-if="hasNotFoundJobs" class="d-flex flex-row-reverse row-cols-lg-auto align-items-end">
        <button class="btn btn-secondary" @click="removeUnknownJobs">
          Remove 'NOT_FOUND' jobs from list
        </button>
      </div>
      <JobsTable
        :jobs="jobs"
        @delete:job="deleteJob"
        @show:logs="showLogs"
        class="mt-2"
        :showDelete="true"
        :showJobLog="true"
      />
      <div v-if="!hasJobs">No jobs found</div>
    </template>
    <div v-else>
      <div class="w-100 d-flex justify-content-between my-2">
        <h5>Job logs</h5>
        <button class="btn btn-sm btn-secondary" @click="log = undefined">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <pre class="border p-2 rounded-2">{{ log }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { type JobList } from '@/model/bakta-service'
import { useBaktaService } from '@/page/page'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import JobsTable from './JobsTable.vue'
import { usePollManager } from './poll-manager'

const jobs = ref<JobList>([])
const loading = ref(false)
const bakta = useBaktaService()
const hasJobs = computed(() => jobs.value.length > 0)
const hasNotFoundJobs = computed(() => jobs.value.some((j) => j.jobStatus === 'NOT_FOUND'))
const error = ref<string>()

const { start, polling, cancel } = usePollManager(
  updateJobs,
  (x) =>
    x.every(
      (j) =>
        j.jobStatus === 'SUCCESSFULL' ||
        j.jobStatus === 'SUCCESSFUL' ||
        j.jobStatus === 'ERROR' ||
        j.jobStatus === 'UNAUTHORIZED' ||
        j.jobStatus === 'NOT_FOUND',
    ),
  2000,
)

function removeUnknownJobs() {
  error.value = undefined
  bakta
    .removeOutdatedJobs()
    .catch((err) => (error.value = err))
    .then(updateJobs)
}

function updateJobs(): Promise<JobList> {
  loading.value = true

  error.value = undefined
  return bakta
    .listJobs()
    .then((x) => {
      x.sort((a, b) => {
        const bs = 'started' in b ? new Date(b.started) : new Date()
        const as = 'started' in a ? new Date(a.started) : new Date()
        return bs.valueOf() - as.valueOf()
      })
      jobs.value = x
      loading.value = false
      return x
    })
    .catch((err) => (error.value = err))
}

function deleteJob(jobID: string) {
  error.value = undefined
  bakta
    .removeJob(jobID)
    .then(updateJobs)
    .catch((err) => (error.value = err))
}
function showLogs(jobID: string) {
  error.value = undefined
  bakta
    .logs(jobID)
    .then(showLog)
    .catch((err) => (error.value = err))
}
const log = ref<string>()
function showLog(l: string) {
  log.value = l
}
onMounted(() => {
  start()
})

onUnmounted(() => {
  cancel()
})
</script>
