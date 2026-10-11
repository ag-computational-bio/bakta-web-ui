<template>
  <div v-if="workflows.length" id="orphans" class="card p-4 mt-4">
    <div class="d-flex align-items-center justify-content-between gap-2">
      <h3 class="section-title mb-0">
        <button
          type="button"
          class="btn btn-link p-0 section-toggle"
          :aria-expanded="expanded"
          aria-controls="orphan-list"
          @click="expanded = !expanded"
        >
          <i
            class="bi me-1"
            :class="expanded ? 'bi-chevron-down' : 'bi-chevron-right'"
            aria-hidden="true"
          ></i
          >Workflows without a job record ({{ workflows.length }})
        </button>
      </h3>
      <button
        class="btn btn-icon btn-sm"
        title="Reload"
        aria-label="Reload the workflows without a job record"
        :disabled="busy"
        @click="load"
      >
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>
    <div v-show="expanded" id="orphan-list" class="mt-3">
      <Notification v-if="error" class="mb-3" type="danger" :message="error" />
      <div class="table-responsive">
        <table class="table table-striped align-middle mb-0">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Phase</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Message</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in pageItems" :key="w.name">
              <td :title="w.template ?? undefined">{{ w.name }}</td>
              <td><StatusBadge :status="phaseStatus(w.phase)" /></td>
              <td class="text-nowrap">{{ formatDateTime(w.started_at) }}</td>
              <td class="text-nowrap">{{ formatDateTime(w.finished_at) }}</td>
              <td class="text-secondary">{{ w.message ?? '' }}</td>
              <td class="text-end">
                <button
                  class="btn btn-sm btn-icon danger-hover"
                  title="Delete"
                  :aria-label="`Delete workflow ${w.name}`"
                  :disabled="busy"
                  @click="remove(w)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ListPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="workflows.length"
        label="workflows"
      />
    </div>

    <ConfirmModal ref="confirmModal" title="Delete the workflow?" confirm-label="Delete" danger>
      <p class="mb-0">The workflow and its pods are deleted from Argo.</p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { WorkflowItem } from '../admin-api'
import { filters } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { formatDateTime, phaseStatus } from '../format'
import { useClientPages } from '../pagination'
import '../admin-menu.css'
import ConfirmModal from './ConfirmModal.vue'
import ListPagination from './ListPagination.vue'

/*
 * Live Argo workflows without a job record, for example from a deleted
 * database row. The section is hidden when there are none and collapsed
 * by default.
 */

const api = useAdminApi()
const workflows = ref<WorkflowItem[]>([])
const busy = ref(false)
const error = ref<string>()
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()
const { page, pageSize, pageItems } = useClientPages(workflows, 10)
// collapsed, unless a link like the one under "Needs attention" points here
const route = useRoute()
const expanded = ref(route.hash === '#orphans')

let request = 0
async function load() {
  const current = ++request
  try {
    const items = await api.workflows({ environment: filters.environment, orphans: true })
    if (current !== request) return
    workflows.value = items
    await nextTick()
    reveal()
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  }
}

async function remove(workflow: WorkflowItem) {
  if (!(await confirmModal.value?.open())) return
  busy.value = true
  error.value = undefined
  try {
    // the bulk endpoint deletes a workflow by name, the name list makes sure only this one
    const result = await api.bulk({
      filter: { q: workflow.name, environment: filters.environment },
      action: 'delete',
      dry_run: false,
      workflow_names: [workflow.name],
    })
    const failed = result.items.find((i) => i.result !== 'done')
    if (failed) error.value = failed.error ?? `Workflow ${workflow.name} was not deleted.`
    await load()
  } catch (e) {
    error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

// scrolls to the section when a link like the one under "Needs attention" points here;
// the section appears once loaded, so this runs after loading
function reveal() {
  if (route.hash === '#orphans') document.getElementById('orphans')?.scrollIntoView()
}

defineExpose({ load, reveal })
watch(() => filters.environment, load, { immediate: true })
</script>

<style scoped>
.section-toggle {
  font: inherit;
  color: inherit;
  text-decoration: none;
}
</style>
