<template>
  <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
    <ChipGroup v-model="filters.environment" :options="environments" label="Environment" />
    <div class="vr d-none d-md-block"></div>
    <ChipGroup v-model="phases" :options="phaseOptions" label="Phase" />
  </div>
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />
  <Notification v-if="result" class="mb-3" type="primary" :message="result" />

  <div class="card p-4 mb-4">
    <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
      <h3 class="section-title mb-0">Live workflows</h3>
      <div class="d-flex align-items-center gap-2">
        <span class="small text-secondary">{{ formatCount(workflows.length) }} workflows</span>
        <button class="btn btn-icon btn-sm" title="Reload" :disabled="loading" @click="load">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>
    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0">
        <thead>
          <tr>
            <th>Workflow</th>
            <th>Job</th>
            <th>Kind</th>
            <th>Phase</th>
            <th>Started</th>
            <th>Finished</th>
            <th>Message</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in workflows" :key="w.name">
            <td class="small" :title="w.template ?? undefined">{{ w.name }}</td>
            <td>
              <RouterLink
                v-if="w.job_id"
                :to="{ name: 'AdminJob', params: { id: w.job_id } }"
                :title="w.job_id"
              >
                {{ w.job_id.slice(0, 8) }}
              </RouterLink>
              <span v-else class="text-secondary">-</span>
            </td>
            <td>
              <Shield
                v-if="isWorkflowKind(w.workflow_kind)"
                v-bind="workflowShieldProps(w.workflow_kind)"
              >
                {{ formatWorkflowKind(w.workflow_kind) }}
              </Shield>
              <span v-else class="text-secondary">-</span>
            </td>
            <td><StatusBadge :status="phaseStatus(w.phase)" /></td>
            <td class="text-nowrap">{{ formatDateTime(w.started_at) }}</td>
            <td class="text-nowrap">{{ formatDateTime(w.finished_at) }}</td>
            <td class="small text-secondary">{{ w.message ?? '' }}</td>
            <td class="text-end text-nowrap">
              <div v-if="w.job_id" class="d-inline-flex gap-1">
                <button
                  v-if="w.phase === 'Failed' || w.phase === 'Error'"
                  class="btn btn-sm btn-outline-secondary"
                  title="Retry"
                  :disabled="busy"
                  @click="runAction(w, 'retry')"
                >
                  <i class="bi bi-arrow-repeat"></i>
                </button>
                <button
                  v-if="w.phase === 'Running'"
                  class="btn btn-sm btn-outline-danger"
                  title="Stop"
                  :disabled="busy"
                  @click="runAction(w, 'stop')"
                >
                  <i class="bi bi-stop-circle"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  title="Delete"
                  :disabled="busy"
                  @click="runAction(w, 'delete')"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && workflows.length === 0">
            <td colspan="8" class="text-center text-secondary py-4">No workflows found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <ConfirmModal ref="confirmModal" v-bind="modal">
    <p class="mb-0">{{ modal.text }}</p>
  </ConfirmModal>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  formatWorkflowKind,
  WorkflowKinds,
  workflowShieldProps,
  type WorkflowKind,
} from '@/model/job'
import { ref, watch } from 'vue'
import { WorkflowPhases, type WorkflowItem, type WorkflowPhase } from '../admin-api'
import { environments, filters } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import ChipGroup from '../components/ChipGroup.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { formatCount, formatDateTime, phaseStatus } from '../format'

type Action = 'retry' | 'stop' | 'delete'

const phaseOptions = WorkflowPhases.map((value) => ({ value, label: value }))
const api = useAdminApi()
const phases = ref<WorkflowPhase[]>([])
const workflows = ref<WorkflowItem[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref<string>()
const result = ref<string>()
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()
const modal = ref({ title: '', text: '', confirmLabel: '', danger: false })

function isWorkflowKind(kind: string | null | undefined): kind is WorkflowKind {
  return (WorkflowKinds as readonly string[]).includes(kind ?? '')
}

let request = 0
async function load() {
  const current = ++request
  loading.value = true
  error.value = undefined
  try {
    const items = await api.workflows({ environment: filters.environment, phases: phases.value })
    if (current === request) workflows.value = items
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

const actionTexts: Record<Action, { title: string; text: string; danger: boolean }> = {
  retry: { title: 'Retry the workflow?', text: 'Argo runs the failed steps again.', danger: false },
  stop: { title: 'Stop the workflow?', text: 'Argo terminates the workflow.', danger: true },
  delete: {
    title: 'Delete the workflow?',
    text: 'The workflow and its pods are deleted and the job is marked as deleted. The S3 data is kept.',
    danger: true,
  },
}

async function runAction(workflow: WorkflowItem, action: Action) {
  const id = workflow.job_id
  if (!id) return
  const label = action.charAt(0).toUpperCase() + action.slice(1)
  modal.value = { ...actionTexts[action], confirmLabel: label }
  if (!(await confirmModal.value?.open())) return
  busy.value = true
  error.value = undefined
  result.value = undefined
  try {
    if (action === 'delete') {
      await api.deleteJob(id, false)
      result.value = `Workflow ${workflow.name} deleted.`
    } else {
      const r = await api[action](id)
      result.value = `${label}: workflow ${r.workflow_name} is now ${r.phase.toLowerCase()}.`
    }
    await load()
  } catch (e) {
    error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

watch([() => filters.environment, phases], load, { immediate: true })
</script>
