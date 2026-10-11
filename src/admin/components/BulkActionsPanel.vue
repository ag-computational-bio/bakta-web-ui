<template>
  <div class="card p-4 mt-4">
    <button
      type="button"
      class="toggle d-flex align-items-center justify-content-between w-100"
      :aria-expanded="open"
      @click="open = !open"
    >
      <h3 class="section-title mb-0">Bulk actions</h3>
      <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
    </button>

    <template v-if="open">
      <p class="text-secondary mt-3">
        Runs one action on all live workflows that match the filters below, in the environment
        chosen at the top of the page. First preview the matching workflows, then run the action.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-3 mb-3">
        <input
          v-model="q"
          type="search"
          class="form-control form-control-sm search"
          placeholder="Workflow name or job ID"
          aria-label="Workflow name or job ID"
        />
        <ChipGroup v-model="phases" :options="phaseOptions" label="Phases" />
        <ChipGroup v-model="kinds" :options="kindOptions" label="Workflow kinds" />
        <div class="d-flex align-items-center gap-2">
          <label class="text-secondary text-nowrap" for="finished-before">Finished more than</label>
          <input
            id="finished-before"
            v-model="hours"
            type="number"
            min="0"
            class="form-control form-control-sm hours"
            placeholder="any"
          />
          <span class="text-secondary text-nowrap">hours ago</span>
        </div>
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <select v-model="action" class="form-select form-select-sm action" aria-label="Action">
          <option v-for="a in BulkActions" :key="a" :value="a">{{ texts[a].label }}</option>
        </select>
        <button class="btn btn-outline-secondary btn-sm" :disabled="busy" @click="preview">
          <i class="bi bi-search me-1"></i>Preview
        </button>
        <span v-if="busy" class="spinner-border spinner-border-sm text-secondary"></span>
      </div>

      <Notification v-if="error" class="mb-3" type="danger" :message="error" />

      <template v-if="items">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <span class="fw-semibold">{{ summary }}</span>
          <button
            v-if="!ran && applicable.length"
            class="btn btn-sm"
            :class="texts[action].danger ? 'btn-danger' : 'btn-primary'"
            :disabled="busy"
            @click="run"
          >
            <i class="bi me-1" :class="texts[action].icon"></i>{{ runLabel }}
          </button>
        </div>
        <div v-if="items.length" class="table-responsive">
          <table class="table table-striped table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Job</th>
                <th>Phase</th>
                <th>Finished</th>
                <th>{{ ran ? 'Result' : 'Applies' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in pageItems" :key="w.name" :class="{ 'not-applicable': !w.applicable }">
                <td class="text-nowrap">{{ w.name }}</td>
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
                <td><StatusBadge :status="phaseStatus(w.phase)" /></td>
                <td class="text-nowrap">{{ formatDateTime(w.finished_at) }}</td>
                <td>
                  <template v-if="ran && w.result">
                    <span class="badge fw-medium" :class="resultClasses[w.result]">
                      {{ w.result }}
                    </span>
                    <span v-if="w.error" class="small text-secondary ms-1">{{ w.error }}</span>
                  </template>
                  <span v-else-if="w.applicable"><i class="bi bi-check-lg"></i> Yes</span>
                  <span v-else class="small">No, {{ texts[action].reason }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="items.length"
          label="workflows"
        />
      </template>
    </template>

    <ConfirmModal
      ref="confirmModal"
      :title="`${runLabel}?`"
      :confirm-label="runLabel"
      :danger="texts[action].danger"
    >
      <p class="mb-0">{{ texts[action].confirm }}</p>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatWorkflowKind, WorkflowKinds } from '@/model/job'
import { computed, ref, watch } from 'vue'
import {
  BulkActions,
  WorkflowPhases,
  type BulkAction,
  type BulkItem,
  type BulkRequest,
  type WorkflowPhase,
} from '../admin-api'
import { filters } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { formatCount, formatDateTime, phaseStatus } from '../format'
import { useClientPages } from '../pagination'
import ChipGroup from './ChipGroup.vue'
import ConfirmModal from './ConfirmModal.vue'
import ListPagination from './ListPagination.vue'

/*
 * One action on many live workflows. Nothing changes without a preview and
 * a confirmation, and the real run only processes the workflows of the preview.
 */

const emit = defineEmits<{ (e: 'done'): void }>()

const texts: Record<
  BulkAction,
  {
    label: string
    done: string
    reason: string
    icon: string
    danger: boolean
    confirm: string
  }
> = {
  delete: {
    label: 'Delete',
    done: 'deleted',
    reason: '',
    icon: 'bi-trash',
    danger: true,
    confirm: 'The workflows and their pods are deleted from Argo. This cannot be undone.',
  },
  stop: {
    label: 'Stop',
    done: 'stopped',
    reason: 'not pending or running',
    icon: 'bi-stop-circle',
    danger: true,
    confirm: 'Argo terminates the workflows. Their jobs end as failed.',
  },
  retry: {
    label: 'Retry',
    done: 'retried',
    reason: 'not failed',
    icon: 'bi-arrow-repeat',
    danger: false,
    confirm: 'Argo runs the failed steps of the workflows again.',
  },
  resume: {
    label: 'Resume',
    done: 'resumed',
    reason: 'not suspended',
    icon: 'bi-play-circle',
    danger: false,
    confirm: 'Argo continues the suspended workflows.',
  },
  resubmit: {
    label: 'Resubmit',
    done: 'resubmitted',
    reason: 'not finished',
    icon: 'bi-send',
    danger: false,
    confirm: 'Argo starts a new workflow with the same parameters for each of them.',
  },
}
const resultClasses = {
  done: 'bg-success-subtle text-success-emphasis',
  skipped: 'bg-secondary-subtle text-secondary-emphasis',
  failed: 'bg-danger-subtle text-danger-emphasis',
}
const phaseOptions = WorkflowPhases.map((value) => ({ value, label: value }))
const kindOptions = WorkflowKinds.map((value) => ({ value, label: formatWorkflowKind(value) }))

const api = useAdminApi()
const open = ref(false)
const q = ref('')
const phases = ref<WorkflowPhase[]>(['Failed', 'Error'])
const kinds = ref<string[]>([])
// text, so an empty field means any time
const hours = ref<number | string>(24)
const action = ref<BulkAction>('delete')
const items = ref<BulkItem[]>()
const ran = ref(false)
const busy = ref(false)
const error = ref<string>()
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()
const { page, pageSize, pageItems } = useClientPages(
  computed(() => items.value ?? []),
  10,
)

const applicable = computed(() => (items.value ?? []).filter((w) => w.applicable))

function count(n: number): string {
  return `${formatCount(n)} ${n === 1 ? 'workflow' : 'workflows'}`
}

const runLabel = computed(() => `${texts[action.value].label} ${count(applicable.value.length)}`)

const summary = computed(() => {
  const list = items.value ?? []
  if (ran.value) {
    const by = (r: string) => list.filter((w) => w.result === r).length
    return `${formatCount(by('done'))} ${texts[action.value].done}, ${formatCount(by('skipped'))} skipped, ${formatCount(by('failed'))} failed`
  }
  if (!list.length) return 'No workflows match.'
  return `${formatCount(list.length)} match, ${formatCount(applicable.value.length)} can be ${texts[action.value].done}`
})

function request(dryRun: boolean): BulkRequest {
  const h = Number(hours.value)
  return {
    filter: {
      q: q.value.trim() || undefined,
      phases: phases.value.length ? phases.value : undefined,
      workflow_kinds: kinds.value.length ? kinds.value : undefined,
      finished_before_hours: hours.value === '' || !(h >= 0) ? undefined : h,
      environment: filters.environment,
    },
    action: action.value,
    dry_run: dryRun,
  }
}

async function call(task: () => Promise<void>) {
  busy.value = true
  error.value = undefined
  try {
    await task()
  } catch (e) {
    error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

function preview() {
  return call(async () => {
    const result = await api.bulk(request(true))
    items.value = result.items
    ran.value = false
    page.value = 1
  })
}

async function run() {
  if (!(await confirmModal.value?.open())) return
  const names = applicable.value.map((w) => w.name)
  await call(async () => {
    const result = await api.bulk({ ...request(false), workflow_names: names })
    items.value = result.items
    ran.value = true
    page.value = 1
    emit('done')
  })
}

// a preview for other settings must not be run, so changes clear it
watch([q, phases, kinds, hours, action, () => filters.environment], () => {
  items.value = undefined
  ran.value = false
})
</script>

<style scoped>
.toggle {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
}
.search {
  max-width: 16rem;
}
.hours {
  width: 5.5rem;
}
.action {
  width: auto;
}
.not-applicable td {
  color: var(--bs-secondary-color);
}
</style>
