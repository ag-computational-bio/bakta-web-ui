<template>
  <AdminFilterBar />
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />
  <Notification v-if="result" class="mb-3" type="primary" :message="result" />

  <div class="card p-4">
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <input
        v-model="search"
        type="search"
        class="form-control form-control-sm search"
        placeholder="Search by job ID, organism or name"
        aria-label="Search jobs"
      />
      <select v-model="sort" class="form-select form-select-sm sort" aria-label="Sort">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span v-if="loading" class="spinner-border spinner-border-sm text-secondary ms-1"></span>
    </div>
    <div class="d-flex flex-column gap-2 mb-3">
      <div class="chip-row">
        <span class="section-label mb-0">Status</span>
        <ChipGroup v-model="statuses" :options="statusOptions" label="Status" />
      </div>
      <div class="chip-row">
        <span class="section-label mb-0">Workflow</span>
        <ChipGroup v-model="kinds" :options="kindOptions" label="Workflow" />
      </div>
      <div class="chip-row">
        <span class="section-label mb-0">Live phase</span>
        <ChipGroup v-model="phases" :options="phaseOptions" label="Live phase" />
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0 jobs">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Organism</th>
            <th class="text-end">Input</th>
            <th>Workflow</th>
            <th>Status</th>
            <th>Live phase</th>
            <th>Created</th>
            <th class="text-end">Runtime</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.id" @click="open(job.id)">
            <td>
              <RouterLink :to="detailLink(job.id)" :title="job.id" @click.stop>
                {{ job.id.slice(0, 8) }}
              </RouterLink>
            </td>
            <td>{{ job.organism ?? '-' }}</td>
            <td class="text-end text-nowrap">
              <template v-if="job.total_length != undefined">
                {{ formatBp(job.total_length) }}
                <div class="small text-secondary">
                  {{ formatCount(job.sequence_count) }}
                  {{ job.sequence_count === 1 ? 'sequence' : 'sequences' }}
                </div>
              </template>
              <template v-else>-</template>
            </td>
            <td>
              <Shield v-bind="workflowShieldProps(job.workflow_kind)">
                {{ formatWorkflowKind(job.workflow_kind) }}
              </Shield>
            </td>
            <td>
              <StatusBadge :status="job.status" />
              <div v-if="outcomeText(job)" class="small text-secondary text-nowrap">
                {{ outcomeText(job) }}
              </div>
            </td>
            <td>
              <StatusBadge
                v-if="job.workflow_phase"
                :status="phaseStatus(job.workflow_phase)"
                :title="job.workflow_name ?? undefined"
              />
              <span v-else class="text-secondary">-</span>
            </td>
            <td class="text-nowrap">{{ formatDateTime(job.created_at) }}</td>
            <td class="text-end text-nowrap">{{ formatDuration(job.runtime_seconds) }}</td>
            <td class="text-end text-nowrap" @click.stop>
              <div v-if="job.status !== 'deleted'" class="d-inline-flex gap-1">
                <button
                  v-for="action in workflowActions(job.workflow_phase)"
                  :key="action"
                  class="btn btn-sm row-action"
                  :class="
                    actionTexts[action].danger ? 'btn-outline-danger' : 'btn-outline-secondary'
                  "
                  :title="actionLabels[action]"
                  :aria-label="`${actionLabels[action]} job ${job.id.slice(0, 8)}`"
                  :disabled="busy"
                  @click="runAction(job, action)"
                >
                  <i class="bi" :class="actionIcons[action]"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && jobs.length === 0">
            <td colspan="9" class="text-center text-secondary py-4">No jobs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ListPagination v-model:page="page" v-model:page-size="pageSize" :total="total" label="jobs" />
  </div>

  <OrphanWorkflows ref="orphans" />
  <BulkActionsPanel @done="reloadAll" />

  <ConfirmModal ref="confirmModal" v-bind="modal">
    <p class="mb-0">{{ modal.text }}</p>
  </ConfirmModal>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatWorkflowKind, workflowShieldProps, WorkflowKinds } from '@/model/job'
import { formatStatus } from '@/model/status-style'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AdminJobStatuses,
  JobSorts,
  WorkflowPhases,
  type AdminJobStatus,
  type JobListItem,
  type JobSort,
  type WorkflowPhase,
} from '../admin-api'
import { filterQuery, filters, statsFilter } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import BulkActionsPanel from '../components/BulkActionsPanel.vue'
import ChipGroup from '../components/ChipGroup.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ListPagination from '../components/ListPagination.vue'
import OrphanWorkflows from '../components/OrphanWorkflows.vue'
import {
  formatBp,
  formatCount,
  formatDateTime,
  formatDuration,
  outcomeText,
  phaseStatus,
} from '../format'
import { pageSizes } from '../pagination'
import {
  actionIcons,
  actionLabels,
  actionTexts,
  workflowActions,
  type WorkflowAction,
} from '../workflow-actions'

const sortOptions: { value: JobSort; label: string }[] = [
  { value: 'created_at', label: 'Newest first' },
  { value: '-created_at', label: 'Oldest first' },
  { value: '-runtime_seconds', label: 'Longest runtime' },
  { value: 'runtime_seconds', label: 'Shortest runtime' },
  { value: '-total_length', label: 'Largest input' },
  { value: 'total_length', label: 'Smallest input' },
]
const statusOptions = AdminJobStatuses.map((value) => ({ value, label: formatStatus(value) }))
const kindOptions = WorkflowKinds.map((value) => ({ value, label: formatWorkflowKind(value) }))
const phaseOptions = WorkflowPhases.map((value) => ({ value, label: value }))

const api = useAdminApi()
const route = useRoute()
const router = useRouter()

// the list settings live in the URL, so the back button returns to the same page
function queryList(value: unknown): string[] {
  return typeof value === 'string' && value ? value.split(',') : []
}
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const sort = ref<JobSort>(JobSorts.find((s) => s === route.query.sort) ?? 'created_at')
const statuses = ref(
  queryList(route.query.status).filter((s): s is AdminJobStatus =>
    (AdminJobStatuses as readonly string[]).includes(s),
  ),
)
const kinds = ref(queryList(route.query.kind))
const phases = ref(
  queryList(route.query.phase).filter((p): p is WorkflowPhase =>
    (WorkflowPhases as readonly string[]).includes(p),
  ),
)
const page = ref(Math.max(1, Number(route.query.page) || 1))
const pageSize = ref<number>(pageSizes.find((n) => n === Number(route.query.size)) ?? 50)

const jobs = ref<JobListItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string>()
const result = ref<string>()
const busy = ref(false)
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()
const modal = ref({ title: '', text: '', confirmLabel: '', danger: false })

function detailLink(id: string) {
  return { name: 'AdminJob', params: { id } }
}

function open(id: string) {
  router.push(detailLink(id))
}

let request = 0
async function load() {
  const current = ++request
  loading.value = true
  error.value = undefined
  router.replace({
    query: {
      ...filterQuery(),
      q: search.value || undefined,
      sort: sort.value === 'created_at' ? undefined : sort.value,
      status: statuses.value.join(',') || undefined,
      kind: kinds.value.join(',') || undefined,
      phase: phases.value.join(',') || undefined,
      page: page.value > 1 ? page.value : undefined,
      size: pageSize.value === 50 ? undefined : pageSize.value,
    },
  })
  try {
    const result = await api.jobs({
      ...statsFilter(),
      q: search.value.trim() || undefined,
      status: statuses.value,
      workflowKind: kinds.value,
      workflowPhase: phases.value,
      sort: sort.value,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
    })
    if (current !== request) return
    jobs.value = result.items
    total.value = result.total
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

const orphans = ref<InstanceType<typeof OrphanWorkflows>>()

function reloadAll() {
  load()
  orphans.value?.load()
}

async function runAction(job: JobListItem, action: WorkflowAction) {
  const label = actionLabels[action]
  modal.value = { ...actionTexts[action], confirmLabel: label }
  if (!(await confirmModal.value?.open())) return
  busy.value = true
  error.value = undefined
  result.value = undefined
  try {
    if (action === 'delete') {
      await api.deleteJob(job.id, false)
      result.value = `Job ${job.id.slice(0, 8)} deleted.`
    } else {
      const r = await api[action](job.id)
      result.value = `${label}: workflow ${r.workflow_name} is now ${r.phase.toLowerCase()}.`
    }
    await load()
  } catch (e) {
    error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

// a new search or filter starts on the first page
let searchTimer: number | undefined
watch(search, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 300)
})
watch([filters, sort, statuses, kinds, phases, pageSize], () =>
  page.value === 1 ? load() : (page.value = 1),
)
watch(page, load)
load()
</script>

<style scoped>
.search {
  max-width: 22rem;
}
.sort {
  width: auto;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
}
.chip-row .section-label {
  width: 6rem;
}
.row-action {
  --bs-btn-padding-x: 0.375rem;
  --bs-btn-padding-y: 0.125rem;
}
.jobs tbody tr {
  cursor: pointer;
}
</style>
