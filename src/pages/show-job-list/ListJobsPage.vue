<template>
  <div class="container flex-grow-1">
    <Notification v-if="error" type="warning" :message="error" />
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
        <tr v-for="item in jobs" :key="item.jobID">
          <td>{{ item.jobID }}</td>
          <td>{{ 'name' in item ? item.name : '' }}</td>
          <td>{{ 'started' in item ? formatDateTime(item.started) : 'unknown' }}</td>
          <td>{{ 'updated' in item ? formatDateTime(item.updated) : 'unknown' }}</td>
          <td>{{ formatState(item.jobStatus) }}</td>
          <td>
            <router-link
              v-if="item.jobStatus === 'SUCCESSFULL'"
              :to="{ name: 'Job', params: { id: item.key } }"
            >
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
          <button class="btn btn-secondary" @click="removeUnknownJobs">
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
import Notification from '@/components/Notification.vue'
import { type JobList } from '@/model/bakta-service'
import type { FailedJobStatus, JobStatus } from '@/model/submit'
import { useBaktaService } from '@/page/page'
import { computed, onMounted, onUnmounted, ref } from 'vue'

function pollManger<T>(
  pollFn: () => Promise<T>,
  stopCondition: (d: T) => boolean,
  timeout: number,
): () => void {
  const fn = () => {
    pollFn().then((x) => {
      if (stopCondition(x)) clearInterval(timer)
    })
  }
  const timer = setInterval(fn, timeout)
  fn()
  return () => clearInterval(timer)
}

const jobs = ref<JobList>([])
const loading = ref(false)
const bakta = useBaktaService()
const hasJobs = computed(() => jobs.value.length > 0)
const hasNotFound = computed(() => jobs.value.some((j) => j.jobStatus === 'NOT_FOUND'))
const error = ref<string>()

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

function removeUnknownJobs() {
  error.value = undefined
  bakta.removeOutdatedJobs().catch((err) => (error.value = err))
}

function updateJobs() {
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

let cancelPoll: () => void
onMounted(() => {
  cancelPoll = pollManger<JobList>(
    updateJobs,
    (x) =>
      x.every(
        (j) =>
          j.jobStatus === 'SUCCESSFULL' ||
          j.jobStatus === 'ERROR' ||
          j.jobStatus === 'UNAUTHORIZED' ||
          j.jobStatus === 'NOT_FOUND',
      ),
    2000,
  )
})

onUnmounted(() => {
  cancelPoll()
})
</script>
