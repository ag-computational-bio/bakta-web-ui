<template>
  <div v-if="logs.stages.length === 0" class="alert alert-secondary mb-0">
    No logs available yet.
  </div>
  <div v-else class="d-flex flex-column gap-3">
    <section
      v-for="stage in logs.stages"
      :key="stage.stage"
      class="border rounded-3 overflow-hidden"
    >
      <header
        class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-body-tertiary"
      >
        <div class="fw-semibold text-capitalize">{{ formatStage(stage.stage) }}</div>
        <span class="badge text-uppercase" :class="statusClass(stage.status)">{{
          stage.status
        }}</span>
      </header>
      <pre v-if="!statusOnly" class="mb-0 p-3 log-block">{{
        stage.content || 'No log output yet.'
      }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { StageStatus, WorkflowLogs } from '@/model/submit'

withDefaults(
  defineProps<{
    logs: WorkflowLogs
    statusOnly?: boolean
  }>(),
  {
    statusOnly: false,
  },
)

function formatStage(stage: string): string {
  return stage.replace(/_/g, ' ')
}

function statusClass(status: StageStatus): string {
  switch (status) {
    case 'running':
      return 'text-bg-info'
    case 'succeeded':
      return 'text-bg-success'
    case 'failed':
    case 'error':
      return 'text-bg-danger'
    case 'pending':
      return 'text-bg-secondary'
    case 'unknown':
      return 'text-bg-dark'
  }
}
</script>

<style scoped>
.log-block {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 24rem;
  overflow: auto;
}
</style>
