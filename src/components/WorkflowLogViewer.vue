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
        class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-surface"
      >
        <div class="fw-semibold text-capitalize">{{ formatStage(stage.stage) }}</div>
        <StatusBadge :status="stage.status" />
      </header>
      <pre v-if="!statusOnly" class="mb-0 p-3 log-block">{{
        stage.content || 'No log output yet.'
      }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import type { WorkflowLogs } from '@/model/submit'

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
</script>

<style scoped>
.log-block {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 24rem;
  overflow: auto;
}
</style>
