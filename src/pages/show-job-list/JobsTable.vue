<template>
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Id</th>
        <th>Jobname</th>
        <th>Submission</th>
        <th>Last updated</th>
        <th>Status</th>
        <th>Link</th>
        <th v-if="showDelete"></th>
      </tr>
    </thead>
    <tbody>
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
        <td v-if="showDelete">
          <button
            class="btn btn-sm btn-outline-danger"
            title="Delete job"
            @click="emit('delete:job', item.jobID)"
          >
            <span class="bi bi-trash"></span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts">
import type { JobList } from '@/model/bakta-service'
import type { FailedJobStatus, JobStatus } from '@/model/submit'

defineProps<{
  jobs: JobList
  showDelete: boolean
}>()
const emit = defineEmits<{
  (e: 'delete:job', jobKey: string): void
}>()

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
</script>
