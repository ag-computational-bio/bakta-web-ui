<template>
  <div ref="element" class="modal fade" tabindex="-1" aria-hidden="true" :aria-labelledby="titleId">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h3 :id="titleId" class="modal-title section-title mb-0">{{ text.label }} workflows</h3>
          <button type="button" class="btn-close" aria-label="Close" @click="hide"></button>
        </div>
        <div class="modal-body">
          <p v-if="scope" class="fw-semibold mb-2">{{ scopeText }}</p>
          <p class="text-secondary mb-2">{{ text.confirm }}</p>
          <div
            v-if="scope && (usedFilters.length || scope.unusedStatuses.length)"
            class="small mb-3"
          >
            <span class="section-label mb-1 d-block">Filters of the job list</span>
            <ul v-if="usedFilters.length" class="list-unstyled mb-0 d-flex flex-wrap gap-1">
              <li
                v-for="f in usedFilters"
                :key="f"
                class="badge bg-secondary-subtle text-body fw-normal"
              >
                {{ f }}
              </li>
            </ul>
            <p v-if="scope.unusedStatuses.length" class="text-secondary mt-1 mb-0">
              Not used for workflows: status
              {{ scope.unusedStatuses.map((v) => formatStatus(v)).join(', ') }}.
            </p>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <label class="text-secondary text-nowrap" for="bulk-finished-before">
              Finished more than
            </label>
            <input
              id="bulk-finished-before"
              v-model="hours"
              type="number"
              min="0"
              class="form-control form-control-sm hours"
              placeholder="any"
              :disabled="!!results || running"
            />
            <span class="text-secondary text-nowrap">hours ago</span>
            <span v-if="busy" class="spinner-border spinner-border-sm text-secondary"></span>
          </div>

          <Notification v-if="error" class="mb-3" type="danger" :message="error" />

          <template v-if="items">
            <p class="fw-semibold mb-2">{{ summary }}</p>
            <p v-if="truncatedText && !results" class="small text-warning-emphasis mb-2">
              {{ truncatedText }}
            </p>
            <div v-if="items.length" class="table-responsive">
              <table class="table table-striped table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Job</th>
                    <th>Phase</th>
                    <th>Finished</th>
                    <th class="text-nowrap">{{ results ? 'Result' : appliesHeader }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="w in pageItems"
                    :key="w.name"
                    :class="{ 'not-applicable': !results && !w.applicable }"
                  >
                    <td class="text-nowrap">{{ w.name }}</td>
                    <td>
                      <RouterLink
                        v-if="w.job_id"
                        :to="{ name: 'AdminJob', params: { id: w.job_id } }"
                        :title="w.job_id"
                        @click="hide"
                      >
                        {{ w.job_id.slice(0, 8) }}
                      </RouterLink>
                      <span v-else class="text-secondary">-</span>
                    </td>
                    <td><StatusBadge :status="phaseStatus(w.phase)" /></td>
                    <td class="text-nowrap">{{ formatDateTime(w.finished_at) }}</td>
                    <td>
                      <template v-if="results">
                        <span
                          v-if="w.result"
                          class="badge fw-medium"
                          :class="resultClasses[w.result]"
                        >
                          {{ w.result }}
                        </span>
                        <span v-if="w.error" class="small text-secondary ms-1">{{ w.error }}</span>
                      </template>
                      <span v-else-if="w.applicable"><i class="bi bi-check-lg"></i> Yes</span>
                      <span v-else class="small">No, {{ reasonText(w) }}</span>
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
        </div>
        <div class="modal-footer">
          <span v-if="confirming" class="text-danger small me-auto">
            <i class="bi bi-exclamation-triangle me-1"></i>Check the list, then click again to
            confirm.
          </span>
          <!-- many workflows: the number is typed instead of a second click -->
          <div
            v-else-if="needsTypedCount && !results && preview"
            class="d-flex flex-wrap align-items-center gap-2 me-auto"
          >
            <label class="small text-danger" :for="countId">
              Type {{ applicable.length }} to confirm
            </label>
            <input
              :id="countId"
              v-model="typedCount"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              class="form-control form-control-sm count"
              :disabled="running"
            />
          </div>
          <button type="button" class="btn btn-outline-secondary" @click="hide">
            {{ results ? 'Close' : 'Cancel' }}
          </button>
          <button
            v-if="!results && preview && applicable.length"
            type="button"
            class="btn"
            :class="text.danger ? 'btn-danger' : 'btn-primary'"
            :disabled="busy || running || (needsTypedCount && !countTyped)"
            @click="confirm"
          >
            <i class="bi me-1" :class="text.icon"></i>{{ runLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatStatus } from '@/model/status-style'
import { Modal } from 'bootstrap'
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import type { BulkAction, BulkItem } from '../admin-api'
import { environments } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { useBulkPreview, type BulkScope } from '../bulk-preview'
import { formatCount, formatDateTime, kindLabel, phaseStatus } from '../format'
import { useClientPages } from '../pagination'
import ListPagination from './ListPagination.vue'

/*
 * One action on the live workflows that match the filters of the job list:
 * a preview first, then the real run on exactly the previewed workflows.
 * Delete and stop need a second click, or the typed number of workflows when
 * there are many.
 */

const emit = defineEmits<{ (e: 'done'): void }>()

type BulkText = {
  label: string
  done: string
  reason: string
  icon: string
  danger: boolean
  confirm: string
}

const texts: Record<BulkAction, BulkText> = {
  delete: {
    label: 'Delete',
    done: 'deleted',
    reason: 'still running, stop it first',
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

const { action, scope, hours, preview, results, applicable, busy, running, error, load, run } =
  useBulkPreview(useAdminApi(), handleAdminError)
const text = computed(() => texts[action.value])
const items = computed(() => results.value ?? preview.value?.items)
const { page, pageSize, pageItems } = useClientPages(
  computed(() => items.value ?? []),
  10,
)
// the first click on delete or stop only asks for the second one
const confirming = ref(false)
watch([preview, results], () => (confirming.value = false))
watch(items, () => (page.value = 1))

// the reason of the server, like "Input data deleted after the retention period", reads after "No, "
function reasonText(w: BulkItem): string {
  if (!w.reason) return text.value.reason
  return w.reason.charAt(0).toLowerCase() + w.reason.slice(1)
}

function count(n: number): string {
  return `${formatCount(n)} ${n === 1 ? 'workflow' : 'workflows'}`
}

const runLabel = computed(() => {
  const n = count(applicable.value.length)
  return confirming.value
    ? `Click again to ${text.value.label.toLowerCase()} ${n}`
    : `${text.value.label} ${n}`
})

const summary = computed(() => {
  if (results.value) {
    const by = (r: string) => formatCount(results.value!.filter((w) => w.result === r).length)
    return `${by('done')} ${text.value.done}, ${by('skipped')} skipped, ${by('failed')} failed`
  }
  const list = preview.value?.items ?? []
  if (!list.length) return 'No workflows match.'
  return `${formatCount(list.length)} match, ${formatCount(applicable.value.length)} can be ${text.value.done}`
})

const truncatedText = computed(() => {
  const p = preview.value
  if (!p?.truncated) return ''
  const shown = formatCount(p.items.length)
  const of = p.total == null ? '' : ` of ${formatCount(p.total)}`
  return `Only the newest ${shown}${of} matching workflows are shown and would be changed.`
})

const usedFilters = computed(() => {
  const s = scope.value
  if (!s) return []
  const list: string[] = []
  if (s.q) list.push(`Search: ${s.q}`)
  if (s.kinds.length) list.push(`Workflow: ${s.kinds.map(kindLabel).join(', ')}`)
  if (s.phases.length) list.push(`Phase: ${s.phases.join(', ')}`)
  if (s.empty) list.push('Status and phase exclude each other')
  return list
})
// the workflows the action works on, in one sentence at the top
const scopeText = computed(() => {
  const s = scope.value
  if (!s) return ''
  const env =
    s.environment === 'all'
      ? 'all environments'
      : (environments.find((e) => e.value === s.environment)?.label ?? s.environment)
  const h = Number(hours.value)
  const age =
    hours.value === '' || !(h >= 0)
      ? 'of any age'
      : `that finished more than ${formatCount(h)} ${h === 1 ? 'hour' : 'hours'} ago`
  return `This works on live Argo workflows in ${env}, ${age}. The time range of the page is not used.`
})

const appliesHeader = computed(() => {
  const list = preview.value?.items ?? []
  return `${formatCount(applicable.value.length)} of ${formatCount(list.length)} apply`
})

// above this many workflows a danger action needs the typed number instead of a second click
const typedCountLimit = 10
const countId = useId()
const typedCount = ref('')
const needsTypedCount = computed(
  () => text.value.danger && applicable.value.length > typedCountLimit,
)
const countTyped = computed(() => typedCount.value.trim() === String(applicable.value.length))
watch(preview, () => (typedCount.value = ''))

function confirm() {
  if (needsTypedCount.value) {
    if (countTyped.value) run()
    return
  }
  if (text.value.danger && !confirming.value) {
    confirming.value = true
    return
  }
  confirming.value = false
  run()
}

// a new number of hours loads a new preview after a short pause
let timer: number | undefined
watch(hours, () => {
  window.clearTimeout(timer)
  if (scope.value && !results.value) timer = window.setTimeout(load, 400)
})

// the title names the dialog for screen readers
const titleId = useId()
const element = ref<HTMLElement>()
let modal: Modal | undefined
let ran = false

function open(a: BulkAction, s: BulkScope) {
  // a run is still on its way, or its result was not shown yet: show it instead of starting anew
  if (running.value || unseen) {
    unseen = false
    visible = true
    modal?.show()
    return
  }
  action.value = a
  scope.value = s
  hours.value = ''
  confirming.value = false
  window.clearTimeout(timer)
  visible = true
  modal?.show()
  load()
}

function hide() {
  modal?.hide()
}

// results change the job list, so it reloads when the modal closes, or at
// once when a run ends while the modal is closed
let visible = false
// a result that came while the modal was closed, it is kept until the modal shows it
let unseen = false
watch(results, (r) => {
  if (!r) return
  if (visible) {
    ran = true
    return
  }
  unseen = true
  emit('done')
})
// the modal counts as closed as soon as it starts to hide
function onHide() {
  visible = false
}
function onHidden() {
  visible = false
  // a run keeps its settings, so its result is still shown when the modal opens again
  if (running.value || unseen) return
  scope.value = undefined
  if (ran) emit('done')
  ran = false
}

onMounted(() => {
  if (!element.value) return
  modal = new Modal(element.value)
  element.value.addEventListener('hide.bs.modal', onHide)
  element.value.addEventListener('hidden.bs.modal', onHidden)
})
onUnmounted(() => {
  window.clearTimeout(timer)
  element.value?.removeEventListener('hide.bs.modal', onHide)
  element.value?.removeEventListener('hidden.bs.modal', onHidden)
  modal?.dispose()
})

defineExpose({ open })
</script>

<style scoped>
.modal {
  --bs-modal-border-radius: var(--bs-border-radius-lg);
  --bs-modal-inner-border-radius: calc(var(--bs-border-radius-lg) - 1px);
  --bs-modal-border-color: var(--bs-border-color);
}
.hours {
  width: 5.5rem;
}
.count {
  width: 5rem;
}
.not-applicable td {
  color: var(--bs-secondary-color);
}
</style>
