<template>
  <div class="py-4">
    <div class="card p-4 text-large">
      <div class="d-flex align-items-center gap-3 mb-3">
        <!-- once a step runs, its own spinner shows the progress -->
        <div
          v-if="displayStatus !== 'RUNNING'"
          class="spinner-border"
          :class="`text-${jobStatusClass}`"
          role="status"
          style="width: 1.5rem; height: 1.5rem"
        >
          <span class="visually-hidden">Waiting...</span>
        </div>
        <div class="flex-grow-1">
          <div class="fw-semibold">Your job is not finished yet.</div>
          <div class="text-secondary small">
            Status:
            <StatusBadge :status="displayStatus" />
          </div>
        </div>
        <button
          v-if="showShareButton"
          class="btn btn-icon btn-sm"
          type="button"
          title="Copy link to clipboard"
          @click="emit('share')"
        >
          <i class="bi bi-share"></i>
        </button>
      </div>

      <div v-if="stages.length > 0">
        <div class="section-label">Workflow steps</div>
        <div class="d-flex flex-column gap-0">
          <div
            v-for="(stage, idx) in stages"
            :key="stage.stage"
            class="py-2"
            :class="{ 'border-top': idx > 0 }"
          >
            <div class="d-flex align-items-center gap-2">
              <div class="stage-icon d-flex align-items-center justify-content-center">
                <div
                  v-if="stage.status === 'running'"
                  class="spinner-border spinner-border-sm text-success"
                  role="status"
                >
                  <span class="visually-hidden">Running...</span>
                </div>
                <i
                  v-else
                  class="bi"
                  :class="[statusIcon(stage.status), `text-${statusTone(stage.status)}`]"
                ></i>
              </div>
              <span class="flex-grow-1 text-capitalize">{{ formatStage(stage.stage) }}</span>
              <button
                v-if="stage.status === 'running'"
                class="btn btn-link btn-sm py-0 px-1"
                type="button"
                @click="toggleLogs(stage.stage)"
              >
                <i class="bi bi-terminal me-1"></i>Logs
                <i
                  class="bi"
                  :class="openLogs.has(stage.stage) ? 'bi-chevron-up' : 'bi-chevron-down'"
                ></i>
              </button>
              <StatusBadge :status="stage.status" />
            </div>
            <pre
              v-if="stage.status === 'running' && openLogs.has(stage.stage)"
              ref="logBlocks"
              :data-stage="stage.stage"
              class="log-block mt-2 mb-0 p-3 rounded-3"
              >{{ stage.content || 'No log output yet.' }}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import { statusIcon, statusTone } from '@/model/status-style'
import type { JobStatus, StageLog } from '@/model/submit'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

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

const openLogs = ref(new Set<string>())
const logBlocks = useTemplateRef<HTMLPreElement[]>('logBlocks')

// the text length of each open log at the last update
const logLengths = new Map<string, number>()

function atBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 24
}

// A log opens at its newest lines. Later it only follows new lines when the
// reader is still at the end, so reading older lines is not interrupted.
watch(
  () => [...openLogs.value, ...props.stages.map((s) => `${s.stage}:${s.content.length}`)].join(),
  async () => {
    const following = new Set(
      (logBlocks.value ?? []).filter(atBottom).map((el) => el.dataset.stage),
    )
    await nextTick()
    for (const el of logBlocks.value ?? []) {
      const stage = el.dataset.stage ?? ''
      const length = el.textContent?.length ?? 0
      const known = logLengths.get(stage)
      if (known == undefined || (length > known && following.has(stage))) {
        el.scrollTop = el.scrollHeight
      }
      logLengths.set(stage, length)
    }
    for (const stage of [...logLengths.keys()]) {
      if (!openLogs.value.has(stage)) logLengths.delete(stage)
    }
  },
)

function toggleLogs(stage: string) {
  const open = new Set(openLogs.value)
  if (!open.delete(stage)) open.add(stage)
  openLogs.value = open
}

// a running step means the workflow runs, even if the job status lags behind
const displayStatus = computed(() =>
  props.stages.some((stage) => stage.status === 'running')
    ? 'RUNNING'
    : (props.jobStatus ?? 'INIT'),
)

const jobStatusClass = computed(() => statusTone(displayStatus.value))

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
  background-color: var(--bakta-surface);
}
.stage-icon {
  width: 1.25rem;
  flex-shrink: 0;
}
</style>
