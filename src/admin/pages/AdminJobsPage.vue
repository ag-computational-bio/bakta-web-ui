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
      <div class="dropdown">
        <button
          ref="filterToggle"
          type="button"
          class="btn btn-outline-secondary btn-sm admin-toggle"
          data-bs-toggle="dropdown"
          data-bs-auto-close="outside"
          aria-expanded="false"
        >
          <i class="bi bi-funnel" aria-hidden="true"></i>
          <span class="toggle-value">Filters</span>
          <span v-if="activeFilters.length" class="badge rounded-pill bg-primary">
            {{ activeFilters.length }}
          </span>
          <i class="bi bi-chevron-down toggle-chevron" aria-hidden="true"></i>
        </button>
        <div class="dropdown-menu admin-menu p-2">
          <div class="filter-menu">
            <fieldset>
              <legend class="section-label">Status</legend>
              <div v-for="option in statusOptions" :key="option.value" class="form-check">
                <input
                  :id="`filter-statuses-${option.value}`"
                  v-model="statuses"
                  class="form-check-input"
                  type="checkbox"
                  :value="option.value"
                />
                <label
                  class="form-check-label text-nowrap"
                  :for="`filter-statuses-${option.value}`"
                >
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend class="section-label">Workflow</legend>
              <div v-for="option in kindOptions" :key="option.value" class="form-check">
                <input
                  :id="`filter-kinds-${option.value}`"
                  v-model="kinds"
                  class="form-check-input"
                  type="checkbox"
                  :value="option.value"
                />
                <label class="form-check-label text-nowrap" :for="`filter-kinds-${option.value}`">
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend class="section-label">Live phase</legend>
              <div v-for="option in phaseOptions" :key="option.value" class="form-check">
                <input
                  :id="`filter-phases-${option.value}`"
                  v-model="phases"
                  class="form-check-input"
                  type="checkbox"
                  :value="option.value"
                />
                <label class="form-check-label text-nowrap" :for="`filter-phases-${option.value}`">
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
          </div>
          <p class="filter-note small text-secondary">
            Status is the state of the job in Bakta Web. Live phase is the state of its Argo
            workflow, only while the workflow exists.
          </p>
          <div class="d-flex justify-content-end gap-2 px-2 pb-1">
            <button type="button" class="btn btn-link btn-sm" @click="resetFilters">Clear</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeFilters">
              Done
            </button>
          </div>
        </div>
      </div>
      <button
        v-for="chip in activeFilters"
        :key="chip.label"
        type="button"
        class="feature-chip filter-chip"
        :aria-label="`Remove filter ${chip.label}`"
        @click="chip.remove()"
      >
        {{ chip.label }}<i class="bi bi-x"></i>
      </button>
      <button
        v-if="activeFilters.length"
        type="button"
        class="btn btn-link btn-sm px-1"
        @click="resetFilters"
      >
        Reset
      </button>
      <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
        <span v-if="loading" class="spinner-border spinner-border-sm text-secondary"></span>
        <span class="small text-secondary text-nowrap">
          {{ formatCount(total) }} {{ total === 1 ? 'job' : 'jobs' }}
        </span>
        <AdminSelect v-model="sort" label="Sort" icon="bi-sort-down" :options="sortOptions" end />
        <div class="dropdown">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm admin-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <span class="toggle-value">Bulk actions</span>
            <i class="bi bi-chevron-down toggle-chevron" aria-hidden="true"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end admin-menu">
            <template v-for="item in bulkItems" :key="item.action">
              <li v-if="item.action === 'stop'"><hr class="dropdown-divider" /></li>
              <li>
                <!-- delete and stop on everything are too easy to start by mistake -->
                <button
                  type="button"
                  class="dropdown-item"
                  :class="{ 'text-danger': item.danger && narrowed }"
                  :aria-disabled="(item.danger && !narrowed) || undefined"
                  :title="item.danger && !narrowed ? 'Set a filter first' : undefined"
                  @click="(!item.danger || narrowed) && openBulk(item.action)"
                >
                  <i class="bi" :class="item.icon" aria-hidden="true"></i>
                  <span>
                    <span class="d-block">{{ item.label }}</span>
                    <span v-if="item.danger && !narrowed" class="item-description">
                      Set a filter first
                    </span>
                  </span>
                </button>
              </li>
            </template>
          </ul>
        </div>
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
            <th>Created</th>
            <th class="text-end">Runtime</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.id">
            <td>
              <RouterLink :to="detailLink(job.id)" :title="job.id">
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
              <div
                v-if="argoNote(job.status, job.workflow_phase)"
                class="small text-secondary text-nowrap"
                :title="job.workflow_name ?? undefined"
              >
                {{ argoNote(job.status, job.workflow_phase) }}
              </div>
              <div
                v-if="!job.data_available"
                class="small text-secondary text-nowrap"
                :title="`Input data, results and logs were deleted on ${formatDateTime(job.data_expires_at)}`"
              >
                <i class="bi bi-archive me-1" aria-hidden="true"></i>Data deleted
              </div>
            </td>
            <td class="text-nowrap">{{ formatDateTime(job.created_at) }}</td>
            <td class="text-end text-nowrap">{{ formatDuration(job.runtime_seconds) }}</td>
            <td class="text-end text-nowrap">
              <JobRowActions
                v-if="job.status !== 'deleted'"
                :id="job.id"
                :phase="job.workflow_phase"
                :data-available="job.data_available"
                :busy="busy"
                @run="runAction(job, $event)"
              />
            </td>
          </tr>
          <tr v-if="!loading && jobs.length === 0">
            <td colspan="8" class="text-center text-secondary py-4">No jobs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ListPagination v-model:page="page" v-model:page-size="pageSize" :total="total" label="jobs" />
  </div>

  <OrphanWorkflows ref="orphans" />
  <BulkActionModal ref="bulkModal" @done="reloadAll" />

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
import { Dropdown } from 'bootstrap'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AdminJobStatuses,
  JobSorts,
  WorkflowPhases,
  type AdminJobStatus,
  type BulkAction,
  type JobListItem,
  type JobSort,
  type WorkflowPhase,
} from '../admin-api'
import { filterQuery, filters, lastJobListQuery, statsFilter } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { bulkScope } from '../bulk-preview'
import '../admin-menu.css'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import AdminSelect from '../components/AdminSelect.vue'
import BulkActionModal from '../components/BulkActionModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import ListPagination from '../components/ListPagination.vue'
import JobRowActions from '../components/JobRowActions.vue'
import OrphanWorkflows from '../components/OrphanWorkflows.vue'
import {
  argoNote,
  formatBp,
  formatCount,
  formatDateTime,
  formatDuration,
  kindLabel,
  outcomeText,
} from '../format'
import { clampPage, pageSizes } from '../pagination'
import { actionLabels, actionTexts, jobActionTitle, type WorkflowAction } from '../workflow-actions'

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
// the bulk menu: the actions that change nothing for good first, then stop and delete
const bulkItems: { action: BulkAction; label: string; icon: string; danger: boolean }[] = [
  { action: 'retry', label: 'Retry', icon: 'bi-arrow-repeat', danger: false },
  { action: 'resume', label: 'Resume', icon: 'bi-play-circle', danger: false },
  { action: 'resubmit', label: 'Resubmit', icon: 'bi-send', danger: false },
  { action: 'stop', label: 'Stop', icon: 'bi-stop-circle', danger: true },
  { action: 'delete', label: 'Delete', icon: 'bi-trash', danger: true },
]

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

let request = 0
async function load() {
  const current = ++request
  loading.value = true
  error.value = undefined
  const query = {
    ...filterQuery(),
    q: search.value || undefined,
    sort: sort.value === 'created_at' ? undefined : sort.value,
    status: statuses.value.join(',') || undefined,
    kind: kinds.value.join(',') || undefined,
    phase: phases.value.join(',') || undefined,
    page: page.value > 1 ? String(page.value) : undefined,
    size: pageSize.value === 50 ? undefined : String(pageSize.value),
  }
  lastJobListQuery.value = query
  // the hash stays, it can point to the workflows section
  router.replace({ hash: route.hash, query })
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
    // after a delete the page can be beyond the end, then the last page loads
    const last = clampPage(page.value, result.total, pageSize.value)
    if (last !== page.value) page.value = last
    // the list moves the workflows section down, so a link to it scrolls again
    nextTick(() => orphans.value?.reveal())
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

const orphans = ref<InstanceType<typeof OrphanWorkflows>>()
const bulkModal = ref<InstanceType<typeof BulkActionModal>>()

// the active filters as removable chips
const activeFilters = computed(() => [
  ...statuses.value.map((v) => ({
    label: `Status: ${formatStatus(v)}`,
    remove: () => (statuses.value = statuses.value.filter((s) => s !== v)),
  })),
  ...kinds.value.map((v) => ({
    label: `Workflow: ${kindLabel(v)}`,
    remove: () => (kinds.value = kinds.value.filter((k) => k !== v)),
  })),
  ...phases.value.map((v) => ({
    label: `Phase: ${v}`,
    remove: () => (phases.value = phases.value.filter((p) => p !== v)),
  })),
])

const filterToggle = ref<HTMLElement>()
function closeFilters() {
  if (filterToggle.value) Dropdown.getOrCreateInstance(filterToggle.value).hide()
}

function resetFilters() {
  statuses.value = []
  kinds.value = []
  phases.value = []
}

// a filter that narrows the jobs: status, phase, workflow kind or search
const narrowed = computed(
  () =>
    !!search.value.trim() ||
    !!statuses.value.length ||
    !!kinds.value.length ||
    !!phases.value.length,
)

function openBulk(action: BulkAction) {
  bulkModal.value?.open(
    action,
    bulkScope({
      q: search.value,
      environment: filters.environment,
      kinds: kinds.value,
      statuses: statuses.value,
      phases: phases.value,
    }),
  )
}

function reloadAll() {
  load()
  orphans.value?.load()
}

async function runAction(job: JobListItem, action: WorkflowAction) {
  const label = actionLabels[action]
  modal.value = {
    ...actionTexts[action],
    title: jobActionTitle(label, job.id, job.organism),
    confirmLabel: label,
  }
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
.filter-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  width: max-content;
  max-width: calc(100vw - 3rem);
}
.filter-note {
  max-width: 28rem;
  margin: 0.5rem 0.75rem;
}
.filter-menu fieldset {
  min-width: 8rem;
}
/* the active filters: small chips with a remove icon */
.feature-chip.filter-chip {
  padding: 0.125rem 0.375rem 0.125rem 0.625rem;
  gap: 0.25rem;
  font-size: var(--bakta-font-size-sm);
}
</style>
