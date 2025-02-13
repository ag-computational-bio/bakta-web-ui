<template>
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Id</th>
        <th>Jobname</th>
        <th>Submission</th>
        <th>Last updated</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in jobs"
        :key="item.jobID"
        :class="{
          'table-danger': item.jobStatus === 'ERROR',
          'table-info': item.jobStatus === 'RUNNING',
        }"
      >
        <td>
          <router-link :to="{ name: 'Job', params: { id: item.key } }">
            {{ item.jobID }}
          </router-link>
        </td>
        <td>{{ 'name' in item ? item.name : '' }}</td>
        <td>{{ 'started' in item ? formatDateTime(item.started) : 'unknown' }}</td>
        <td>{{ 'updated' in item ? formatDateTime(item.updated) : 'unknown' }}</td>
        <td>
          <i class="me-2" :class="stateIcon(item.jobStatus)"></i>{{ formatState(item.jobStatus) }}
        </td>

        <td>
          <router-link
            v-if="item.jobStatus === 'SUCCESSFULL' || item.jobStatus === 'SUCCESSFUL'"
            :to="{ name: 'Job', params: { id: item.key } }"
            class="btn btn-sm btn-outline-secondary me-1 mb-1"
          >
            <i class="bi bi-eye"></i>
          </router-link>
          <button
            v-if="showJobLog"
            class="btn btn-sm btn-outline-secondary me-1 mb-1"
            title="Show job logs"
            @click="emit('show:logs', item.jobID)"
          >
            <span class="bi bi-file-earmark-text"></span>
          </button>
          <button
            v-if="showDelete"
            class="btn btn-sm btn-outline-danger me-1 mb-1"
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
  showJobLog: boolean
}>()
const emit = defineEmits<{
  (e: 'delete:job', jobKey: string): void
  (e: 'show:logs', jobKey: string): void
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

function stateIcon(state: JobStatus | FailedJobStatus): string {
  switch (state) {
    case 'INIT':
      return 'bi bi-hourglass'
    case 'RUNNING':
      return 'bi bi-gear'
    case 'SUCCESSFUL':
    case 'SUCCESSFULL':
      return 'bi bi-check2-circle'
    case 'NOT_FOUND':
    case 'UNAUTHORIZED':
    case 'ERROR':
      return 'bi bi-x-circle'
  }
}
</script>
