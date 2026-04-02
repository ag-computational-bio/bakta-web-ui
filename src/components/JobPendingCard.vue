<template>
  <div class="py-4">
    <div class="border rounded-3 p-4">
      <div class="d-flex align-items-center gap-3 mb-3">
        <div
          class="spinner-border"
          :class="`text-${jobStatusClass}`"
          role="status"
          style="width: 1.5rem; height: 1.5rem"
        >
          <span class="visually-hidden">Running...</span>
        </div>
        <div class="flex-grow-1">
          <div class="fw-semibold">Your job is not finished yet.</div>
          <div class="text-secondary small">
            Status:
            <span class="badge" :class="`text-bg-${jobStatusClass}`">{{
              jobStatus ?? 'INIT'
            }}</span>
          </div>
        </div>
        <button
          v-if="showShareButton"
          class="btn btn-outline-secondary btn-sm border-0"
          type="button"
          title="Copy link to clipboard"
          @click="emit('share')"
        >
          <i class="bi bi-share"></i>
        </button>
      </div>

      <div v-if="stages.length > 0">
        <div class="text-secondary small fw-semibold mb-2">Workflow steps</div>
        <div class="d-flex flex-column gap-0">
          <div
            v-for="(stage, idx) in stages"
            :key="stage.stage"
            class="d-flex align-items-center gap-2 py-2"
            :class="{ 'border-top': idx > 0 }"
          >
            <div class="stage-icon d-flex align-items-center justify-content-center">
              <i
                v-if="stage.status === 'succeeded'"
                class="bi bi-check-circle-fill text-success"
              ></i>
              <i
                v-else-if="stage.status === 'failed' || stage.status === 'error'"
                class="bi bi-x-circle-fill text-danger"
              ></i>
              <div
                v-else-if="stage.status === 'running'"
                class="spinner-border spinner-border-sm text-success"
                role="status"
              >
                <span class="visually-hidden">Running...</span>
              </div>
              <i v-else class="bi bi-circle text-secondary"></i>
            </div>
            <span class="flex-grow-1 text-capitalize">{{ formatStage(stage.stage) }}</span>
            <span class="badge text-uppercase" :class="stageStatusClass(stage.status)">{{
              stage.status
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobStatus, StageLog, StageStatus } from '@/model/submit'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    jobStatus?: JobStatus
    stages?: StageLog[]
    showShareButton?: boolean
  }>(),
  {
    stages: () => [],
    showShareButton: false,
  },
)

const emit = defineEmits<{
  (e: 'share'): void
}>()

const jobStatusClass = computed(() => {
  if (props.jobStatus === 'RUNNING') return 'success'
  if (props.jobStatus) return 'warning'
  return 'secondary'
})

function formatStage(stage: string): string {
  return stage.replace(/_/g, ' ')
}

function stageStatusClass(status: StageStatus): string {
  switch (status) {
    case 'running':
      return 'text-bg-success'
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
.stage-icon {
  width: 1.25rem;
  flex-shrink: 0;
}
</style>
