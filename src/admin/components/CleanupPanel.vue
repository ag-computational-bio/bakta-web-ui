<template>
  <div class="card p-4">
    <h3 class="section-title">Clean up workflows</h3>
    <p class="text-secondary">
      Deletes finished workflows and their pods from Argo. First list the matching workflows, then
      delete them.
    </p>
    <div class="d-flex flex-wrap align-items-end gap-3 mb-3">
      <div>
        <div class="form-label">Phases</div>
        <ChipGroup v-model="phases" :options="phaseOptions" label="Phases to clean up" />
      </div>
      <div>
        <label class="form-label" for="older-than">Finished more than</label>
        <div class="d-flex align-items-center gap-2">
          <input
            id="older-than"
            v-model.number="olderThanHours"
            type="number"
            min="0"
            class="form-control form-control-sm hours"
          />
          <span class="text-secondary">hours ago</span>
        </div>
      </div>
      <button
        class="btn btn-outline-secondary btn-sm"
        :disabled="busy || phases.length === 0"
        @click="dryRun"
      >
        <i class="bi bi-search me-1"></i>List matching workflows
      </button>
    </div>

    <Notification v-if="error" class="mb-3" type="danger" :message="error" />
    <Notification v-if="result" class="mb-3" type="primary" :message="result" />

    <template v-if="preview">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <span class="fw-semibold">
          {{ preview.length }} {{ preview.length === 1 ? 'workflow' : 'workflows' }} would be
          deleted
        </span>
        <button
          v-if="preview.length"
          class="btn btn-outline-danger btn-sm"
          :disabled="busy"
          @click="run"
        >
          <i class="bi bi-trash me-1"></i>Delete {{ preview.length }}
          {{ preview.length === 1 ? 'workflow' : 'workflows' }}
        </button>
      </div>
      <div v-if="preview.length" class="table-responsive preview">
        <table class="table table-striped table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Job</th>
              <th>Phase</th>
              <th>Finished</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in preview" :key="w.name">
              <td class="font-monospace small">{{ w.name }}</td>
              <td class="font-monospace small">{{ w.job_id?.slice(0, 8) ?? '-' }}</td>
              <td><StatusBadge :status="phaseStatus(w.phase)" /></td>
              <td class="text-nowrap">{{ formatDateTime(w.finished_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <ConfirmModal
      ref="confirmModal"
      title="Delete the workflows?"
      :confirm-label="`Delete ${preview?.length ?? 0} workflows`"
      danger
    >
      <p class="mb-0">
        The listed workflows and their pods are deleted from Argo. This cannot be undone.
      </p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ref, watch } from 'vue'
import type { CleanupRequest, CleanupResult, WorkflowPhase } from '../admin-api'
import { filters } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { formatDateTime, phaseStatus } from '../format'
import ChipGroup from './ChipGroup.vue'
import ConfirmModal from './ConfirmModal.vue'

const emit = defineEmits<{ (e: 'cleaned'): void }>()

// running and pending workflows are never cleaned up here
const phaseOptions: { value: WorkflowPhase; label: string }[] = [
  { value: 'Succeeded', label: 'Succeeded' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Error', label: 'Error' },
]

const api = useAdminApi()
const phases = ref<WorkflowPhase[]>(['Failed', 'Error'])
const olderThanHours = ref(24)
const preview = ref<CleanupResult['workflows']>()
const busy = ref(false)
const error = ref<string>()
const result = ref<string>()
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()

function request(dryRun: boolean): CleanupRequest {
  return {
    phases: phases.value,
    older_than_hours: Math.max(0, olderThanHours.value || 0),
    environment: filters.environment,
    dry_run: dryRun,
  }
}

async function call(task: () => Promise<void>) {
  busy.value = true
  error.value = undefined
  result.value = undefined
  try {
    await task()
  } catch (e) {
    error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

function dryRun() {
  return call(async () => {
    preview.value = (await api.cleanup(request(true))).workflows
  })
}

async function run() {
  if (!(await confirmModal.value?.open())) return
  await call(async () => {
    const deleted = (await api.cleanup(request(false))).workflows
    preview.value = undefined
    result.value = `${deleted.length} ${deleted.length === 1 ? 'workflow' : 'workflows'} deleted.`
    emit('cleaned')
  })
}

// a list for other settings must not be deleted, so changes clear it
watch([phases, olderThanHours, () => filters.environment], () => (preview.value = undefined))
</script>

<style scoped>
.hours {
  width: 6rem;
}
.preview {
  max-height: 24rem;
  overflow: auto;
}
</style>
