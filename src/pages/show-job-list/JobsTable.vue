<template>
  <div class="table-responsive">
    <table class="table align-middle mb-0">
      <thead>
        <tr>
          <th>Id</th>
          <th>Jobname</th>
          <th>Type</th>
          <th>Submission</th>
          <th>Last updated</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in jobs" :key="item.jobID">
          <td class="font-monospace">
            <router-link :to="{ name: routeName(item.workflowKind), params: { id: item.key } }">
              {{ item.jobID }}
            </router-link>
          </td>
          <td>{{ 'name' in item ? item.name : '' }}</td>
          <td>
            <Shield v-if="item.workflowKind" v-bind="workflowShieldProps(item.workflowKind)">
              {{ formatWorkflowKind(item.workflowKind) }}
            </Shield>
          </td>
          <td>{{ 'started' in item ? formatDateTime(item.started) : 'unknown' }}</td>
          <td>{{ 'updated' in item ? formatDateTime(item.updated) : 'unknown' }}</td>
          <td>
            <StatusBadge :status="item.jobStatus" />
          </td>

          <td class="text-nowrap">
            <div class="d-flex gap-1">
              <router-link
                v-if="item.jobStatus === 'SUCCESSFULL' || item.jobStatus === 'SUCCESSFUL'"
                :to="{ name: routeName(item.workflowKind), params: { id: item.key } }"
                class="btn btn-sm btn-outline-secondary"
              >
                <i class="bi bi-eye"></i>
              </router-link>
              <button
                v-if="showJobLog"
                class="btn btn-sm btn-outline-secondary"
                title="Show job logs"
                @click="emit('show:logs', item.jobID)"
              >
                <i class="bi bi-file-earmark-text"></i>
              </button>
              <button
                v-if="showDelete"
                class="btn btn-sm btn-outline-danger"
                title="Delete job"
                @click="emit('delete:job', item.jobID)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { workflowRouteName } from '@/model/bakta-service'
import { formatWorkflowKind, workflowShieldProps, type WorkflowKind } from '@/model/job'
import type { JobList } from '@/model/bakta-service'

defineProps<{
  jobs: JobList
  showDelete: boolean
  showJobLog: boolean
}>()
const emit = defineEmits<{
  (e: 'delete:job', jobKey: string): void
  (e: 'show:logs', jobKey: string): void
}>()

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

function routeName(workflowKind: WorkflowKind | undefined): 'Job' | 'JobBakta' | 'JobProteins' {
  if (!workflowKind) return 'Job'
  return workflowRouteName(workflowKind)
}
</script>
