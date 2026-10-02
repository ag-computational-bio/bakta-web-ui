<template>
  <div class="container flex-grow-1">
    <Notification v-if="error" class="mb-3" type="warning" :message="error" />
    <template v-if="logs == undefined">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 class="h5 mb-0">Your jobs</h2>
        <div class="d-flex align-items-center gap-3">
          <span v-if="polling" class="small text-secondary d-flex align-items-center gap-2">
            <span v-if="loading" class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </span>
            Updating automatically
          </span>
          <button
            v-if="hasNotFoundJobs"
            class="btn btn-outline-secondary btn-sm"
            @click="removeUnknownJobs"
          >
            Remove outdated jobs
          </button>
        </div>
      </div>
      <div v-if="hasJobs" class="card overflow-hidden">
        <JobsTable
          :jobs="jobs"
          @delete:job="deleteJob"
          @show:logs="showLogs"
          :showDelete="true"
          :showJobLog="true"
        />
      </div>
      <div v-else class="card text-center p-5">
        <i class="bi bi-inbox fs-1 text-secondary"></i>
        <p class="fw-semibold mt-2 mb-1">No jobs found</p>
        <p class="text-secondary">Jobs you submit from this browser are listed here.</p>
        <div>
          <RouterLink to="/submit" class="btn btn-primary">Submit a job</RouterLink>
        </div>
      </div>
    </template>
    <div v-else>
      <div class="w-100 d-flex justify-content-between align-items-center mb-3">
        <h2 class="h5 mb-0">Job logs</h2>
        <button
          class="btn btn-sm btn-outline-secondary"
          title="Close logs"
          @click="logs = undefined"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <WorkflowLogViewer :logs="logs" />
    </div>
  </div>
</template>
<script setup lang="ts">
import WorkflowLogViewer from '@/components/WorkflowLogViewer.vue'
import Notification from '@/components/Notification.vue'
import { type JobList } from '@/model/bakta-service'
import type { WorkflowLogs } from '@/model/submit'
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
    .then(showLogsPanel)
    .catch((err) => (error.value = err))
}
const logs = ref<WorkflowLogs>()
function showLogsPanel(value: WorkflowLogs) {
  logs.value = value
}
onMounted(() => {
  start()
})

onUnmounted(() => {
  cancel()
})
</script>
