<template>
  <AdminFilterBar />
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />

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
      <span class="ms-auto small text-secondary">{{ countText }}</span>
    </div>
    <div class="d-flex flex-column gap-2 mb-3">
      <ChipGroup v-model="statuses" :options="statusOptions" label="Status" />
      <ChipGroup v-model="kinds" :options="kindOptions" label="Workflow" />
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.id" @click="open(job.id)">
            <td>
              <RouterLink
                :to="detailLink(job.id)"
                class="font-monospace"
                :title="job.id"
                @click.stop
              >
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
            <td><StatusBadge :status="job.status" /></td>
            <td class="text-nowrap">{{ formatDateTime(job.created_at) }}</td>
            <td class="text-end text-nowrap">{{ formatDuration(job.runtime_seconds) }}</td>
          </tr>
          <tr v-if="!loading && jobs.length === 0">
            <td colspan="7" class="text-center text-secondary py-4">No jobs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="pages > 1" class="d-flex justify-content-end mt-3" aria-label="Job pages">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" @click="page--">Previous</button>
        </li>
        <li
          v-for="p in pageButtons"
          :key="p"
          class="page-item"
          :class="{ active: p === page, disabled: p === 0 }"
        >
          <button class="page-link" @click="p && (page = p)">{{ p || '...' }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === pages }">
          <button class="page-link" @click="page++">Next</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatWorkflowKind, workflowShieldProps, WorkflowKinds } from '@/model/job'
import { formatStatus } from '@/model/status-style'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AdminJobStatuses,
  JobSorts,
  type AdminJobStatus,
  type JobListItem,
  type JobSort,
} from '../admin-api'
import { filters, statsFilter } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import ChipGroup from '../components/ChipGroup.vue'
import { formatBp, formatCount, formatDateTime, formatDuration } from '../format'

const pageSize = 50
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
const page = ref(Math.max(1, Number(route.query.page) || 1))

const jobs = ref<JobListItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string>()

const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const countText = computed(() => {
  if (total.value === 0) return ''
  const first = (page.value - 1) * pageSize + 1
  const last = Math.min(total.value, page.value * pageSize)
  return `${formatCount(first)} to ${formatCount(last)} of ${formatCount(total.value)} jobs`
})
// first, last and the pages around the current one, 0 stands for a gap
const pageButtons = computed(() => {
  const list: number[] = []
  for (let p = 1; p <= pages.value; p++) {
    if (p === 1 || p === pages.value || Math.abs(p - page.value) <= 2) list.push(p)
    else if (list[list.length - 1] !== 0) list.push(0)
  }
  return list
})

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
      q: search.value || undefined,
      sort: sort.value === 'created_at' ? undefined : sort.value,
      status: statuses.value.join(',') || undefined,
      kind: kinds.value.join(',') || undefined,
      page: page.value > 1 ? page.value : undefined,
    },
  })
  try {
    const result = await api.jobs({
      ...statsFilter(),
      q: search.value.trim() || undefined,
      status: statuses.value,
      workflowKind: kinds.value,
      sort: sort.value,
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
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

// a new search or filter starts on the first page
let searchTimer: number | undefined
watch(search, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 300)
})
watch([filters, sort, statuses, kinds], () => (page.value === 1 ? load() : (page.value = 1)))
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
.jobs tbody tr {
  cursor: pointer;
}
</style>
