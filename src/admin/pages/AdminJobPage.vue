<template>
  <RouterLink v-slot="{ href, navigate }" :to="listLink" custom>
    <a :href="href" class="small d-inline-block mb-3" @click="backToList($event, navigate)">
      <i class="bi bi-arrow-left me-1"></i>All jobs
    </a>
  </RouterLink>
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />
  <Notification v-if="result" class="mb-3" type="primary" :message="result" />

  <div v-if="!detail && !error" class="card text-center p-5">
    <div class="spinner-border text-primary mx-auto" role="status"></div>
  </div>

  <template v-if="detail">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <h3 class="section-title mb-0">{{ job.id }}</h3>
        <button
          type="button"
          class="btn btn-icon btn-sm"
          :title="copied ? 'Copied' : 'Copy the job ID'"
          :aria-label="copied ? 'Job ID copied' : 'Copy the job ID'"
          @click="copyId"
        >
          <i class="bi" :class="copied ? 'bi-check2' : 'bi-clipboard'"></i>
        </button>
        <StatusBadge :status="job.status" />
        <span v-if="outcomeText(job)" class="text-secondary">{{ outcomeText(job) }}</span>
        <Shield v-bind="workflowShieldProps(job.workflow_kind)">
          {{ formatWorkflowKind(job.workflow_kind) }}
        </Shield>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button
          class="btn btn-icon btn-sm"
          title="Reload"
          aria-label="Reload the job"
          :disabled="busy"
          @click="load()"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <!-- only the actions that apply; retry and resubmit need the input data -->
        <button
          v-if="job.data_available && canRetry"
          class="btn btn-outline-secondary btn-sm"
          title="Run the failed steps again"
          :disabled="busy"
          @click="runAction('retry')"
        >
          <i class="bi bi-arrow-repeat me-1"></i>Retry
        </button>
        <button
          v-if="workflow?.suspended"
          class="btn btn-outline-secondary btn-sm"
          :disabled="busy"
          @click="runAction('resume')"
        >
          <i class="bi bi-play-circle me-1"></i>Resume
        </button>
        <button
          v-if="job.data_available && job.status !== 'deleted'"
          class="btn btn-outline-secondary btn-sm"
          title="Start a new workflow with the same parameters"
          :disabled="busy"
          @click="runAction('resubmit')"
        >
          <i class="bi bi-send me-1"></i>Resubmit
        </button>
        <button
          v-if="canStop"
          class="btn btn-outline-danger btn-sm"
          :disabled="busy"
          @click="runAction('stop')"
        >
          <i class="bi bi-stop-circle me-1"></i>Stop
        </button>
        <button
          v-if="job.status !== 'deleted'"
          class="btn btn-outline-danger btn-sm"
          :disabled="busy"
          @click="runDelete"
        >
          <i class="bi bi-trash me-1"></i>Delete
        </button>
      </div>
    </div>

    <div v-if="job.error_message" class="alert alert-danger d-flex flex-wrap gap-2 mb-3">
      <span class="flex-grow-1"><i class="bi bi-x-circle me-1"></i>{{ job.error_message }}</span>
      <a v-if="logs" href="#job-logs" class="alert-link" @click.prevent="showLog">Show log</a>
    </div>

    <p v-if="!job.data_available" class="small text-secondary mb-3">
      <i class="bi bi-info-circle me-1"></i>Input data, results and logs were deleted on
      {{ formatDateTime(job.data_expires_at) }}, 30 days after the job.
    </p>

    <div class="row g-3 mb-4">
      <div v-for="panel in panels" :key="panel.title" class="col-md-6">
        <section class="panel h-100">
          <h4 class="section-label">{{ panel.title }}</h4>
          <DisplayTuple
            v-for="row in panel.rows"
            :key="row.label"
            :label="row.label"
            :value="row.value"
          />
        </section>
      </div>
    </div>

    <div class="card p-4 mb-4">
      <h3 class="section-title">Input options</h3>
      <div v-if="options.length" class="row">
        <div v-for="option in options" :key="option.label" class="col-md-6 col-xl-4">
          <DisplayTuple :label="option.label" :value="option.value" :break="7" />
        </div>
      </div>
      <p v-else class="text-secondary mb-0">No input options stored for this job.</p>
    </div>

    <div class="card p-4 mb-4">
      <h3 class="section-title">Argo workflow</h3>
      <p v-if="!workflow" class="text-secondary mb-0">The workflow no longer exists in Argo.</p>
      <template v-else>
        <div class="d-flex flex-wrap align-items-center gap-3 mb-3">
          <span>{{ workflow.name }}</span>
          <StatusBadge :status="phaseStatus(workflow.phase)" />
          <span v-if="workflow.suspended" class="badge bg-info-subtle text-info-emphasis fw-medium">
            <i class="bi bi-pause-circle me-1"></i>Suspended
          </span>
          <!-- the job error above often says the same -->
          <span
            v-if="workflow.message && workflow.message !== job.error_message"
            class="text-secondary"
          >
            {{ workflow.message }}
          </span>
        </div>
        <div class="table-responsive">
          <table class="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>Step</th>
                <th>Type</th>
                <th>Phase</th>
                <th>Pod</th>
                <th>Started</th>
                <th class="text-end">Duration</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in nodePage" :key="node.name">
                <td>{{ node.display_name }}</td>
                <td>{{ node.type }}</td>
                <td><StatusBadge :status="phaseStatus(node.phase)" /></td>
                <td class="small text-nowrap">{{ node.pod_name ?? '-' }}</td>
                <td class="text-nowrap">{{ formatDateTime(node.started_at) }}</td>
                <td class="text-end text-nowrap">
                  {{ formatDuration(seconds(node.started_at, node.finished_at)) }}
                </td>
                <td>{{ node.message ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ListPagination
          v-model:page="nodePageNumber"
          v-model:page-size="nodePageSize"
          :total="workflow.nodes.length"
          label="steps"
        />
      </template>
    </div>

    <div id="job-logs" class="card p-4">
      <h3 class="section-title">Logs</h3>
      <WorkflowLogViewer v-if="logs" :logs="logs" />
      <p v-else-if="logsDeleted" class="text-secondary mb-0">
        The logs were deleted after the retention period.
      </p>
      <p v-else-if="logsError" class="text-secondary mb-0">No logs available: {{ logsError }}</p>
      <div v-else class="spinner-border spinner-border-sm text-secondary"></div>
    </div>
  </template>

  <ConfirmModal ref="confirmModal" v-bind="modal">
    <p class="mb-0">{{ modal.text }}</p>
    <div v-if="modal.purgeOption" class="form-check mt-3">
      <input id="purge-data" v-model="purgeData" class="form-check-input" type="checkbox" />
      <label class="form-check-label" for="purge-data">
        Also delete the S3 data of the job (input and result files)
      </label>
    </div>
  </ConfirmModal>
</template>

<script setup lang="ts">
import DisplayTuple from '@/components/DisplayTuple.vue'
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import WorkflowLogViewer from '@/components/WorkflowLogViewer.vue'
import { formatWorkflowKind, workflowShieldProps } from '@/model/job'
import type { WorkflowLogs } from '@/model/submit'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdminApiError, type JobDetail } from '../admin-api'
import { filterQuery, lastJobListQuery } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import ConfirmModal from '../components/ConfirmModal.vue'
import ListPagination from '../components/ListPagination.vue'
import {
  configEntries,
  formatBp,
  formatCount,
  formatDateTime,
  formatDuration,
  outcomeText,
  phaseStatus,
} from '../format'
import { useClientPages } from '../pagination'
import { jobActionTitle } from '../workflow-actions'

type Action = 'retry' | 'resubmit' | 'stop' | 'resume'

const api = useAdminApi()
const route = useRoute()
const router = useRouter()
const detail = ref<JobDetail>()
const logs = ref<WorkflowLogs>()
const logsError = ref<string>()
const logsDeleted = ref(false)
const error = ref<string>()
const result = ref<string>()
const busy = ref(false)
const purgeData = ref(false)
const confirmModal = ref<InstanceType<typeof ConfirmModal>>()
const modal = ref({ title: '', confirmLabel: '', danger: false, text: '', purgeOption: false })

const id = computed(() => String(route.params.id))
const job = computed(() => detail.value!.job)
const workflow = computed(() => detail.value?.workflow)
const canRetry = computed(() => ['Failed', 'Error'].includes(workflow.value?.phase ?? ''))
const canStop = computed(() => workflow.value?.phase === 'Running')
const {
  page: nodePageNumber,
  pageSize: nodePageSize,
  pageItems: nodePage,
} = useClientPages(computed(() => workflow.value?.nodes ?? []))
const options = computed(() => configEntries(job.value.config ?? {}))
const organism = computed(() =>
  [job.value.genus, job.value.species, job.value.strain].filter(Boolean).join(' '),
)

// back to the list with its last search and filters
const listLink = computed(() => ({
  path: '/admin/jobs',
  query: lastJobListQuery.value ?? filterQuery(),
}))
function backToList(event: MouseEvent, navigate: (e: MouseEvent) => unknown) {
  // a modified click or another button keeps the normal link behavior of the browser
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  // coming from the list, the browser history has the list with its scroll position
  const back = window.history.state?.back
  if (typeof back === 'string' && back.split('?')[0] === '/admin/jobs') {
    event.preventDefault()
    router.back()
  } else {
    // the router link stops the browser itself, and pushes the list
    navigate(event)
  }
}

const copied = ref(false)
async function copyId() {
  await navigator.clipboard?.writeText(job.value.id)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1500)
}

// scrolls to the log of the failed step, or to the logs
function showLog() {
  const failed = logs.value?.stages.find((s) => s.status === 'failed')
  const target =
    (failed && document.getElementById(`log-${failed.stage}`)) ||
    document.getElementById('job-logs')
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function seconds(from?: string | null, to?: string | null): number | null {
  if (!from || !to) return null
  return (Date.parse(to) - Date.parse(from)) / 1000
}

const panels = computed(() => {
  const j = job.value
  return [
    {
      title: 'Job',
      rows: [
        { label: 'Name', value: j.name ?? '-' },
        { label: 'Environment', value: j.environment },
        { label: 'API version', value: j.api_version },
        { label: 'Workflow', value: j.workflow_name ?? '-' },
      ],
    },
    {
      title: 'Input',
      rows: [
        {
          label: 'Organism',
          value: [j.genus, j.species, j.strain].filter(Boolean).join(' ') || '-',
        },
        { label: 'Sequences', value: formatCount(j.sequence_count) },
        { label: 'Total length', value: formatBp(j.total_length) },
      ],
    },
    {
      title: 'Times',
      rows: [
        { label: 'Created', value: formatDateTime(j.created_at) },
        { label: 'Submitted', value: formatDateTime(j.submitted_at) },
        { label: 'Started', value: formatDateTime(j.started_at) },
        { label: 'Finished', value: formatDateTime(j.finished_at) },
        { label: 'Updated', value: formatDateTime(j.updated_at) },
        { label: 'Queue time', value: formatDuration(j.queue_seconds) },
        { label: 'Runtime', value: formatDuration(j.runtime_seconds) },
      ],
    },
    {
      title: 'Versions',
      rows: [
        { label: 'Bakta', value: j.bakta_version ?? '-' },
        { label: 'Bakta DB', value: j.bakta_db_version ?? '-' },
        { label: 'Baktfold', value: j.baktfold_version ?? '-' },
        { label: 'Baktfold DB', value: j.baktfold_db_version ?? '-' },
      ],
    },
  ]
})

// only the answers of the newest request are shown, so a late answer for
// another job cannot replace the shown one
let request = 0
async function load() {
  const current = ++request
  const jobId = id.value
  error.value = undefined
  let d: JobDetail
  try {
    d = await api.job(jobId)
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
    return
  }
  if (current !== request) return
  detail.value = d
  // archived logs are gone with the data, only a live workflow still has them
  if (!d.job.data_available && !d.workflow) {
    logsDeleted.value = true
    return
  }
  api
    .jobLogs(jobId)
    .then((l) => current === request && (logs.value = l))
    .catch((e) => {
      if (current !== request) return
      if (e instanceof AdminApiError && e.status === 410) logsDeleted.value = true
      else logsError.value = handleAdminError(e)
    })
}

async function confirm(settings: Partial<typeof modal.value>): Promise<boolean> {
  modal.value = { title: '', confirmLabel: '', danger: false, text: '', purgeOption: false }
  Object.assign(modal.value, settings)
  return (await confirmModal.value?.open()) ?? false
}

/**
 * Runs an action on the shown job. Nothing happens when another job was opened
 * while the confirmation was open, and its result is only shown on that job.
 */
async function perform(jobId: string, task: () => Promise<string>) {
  if (jobId !== id.value) return
  busy.value = true
  error.value = undefined
  result.value = undefined
  try {
    const text = await task()
    if (jobId !== id.value) return
    result.value = text
    await load()
  } catch (e) {
    if (jobId === id.value) error.value = handleAdminError(e)
  } finally {
    busy.value = false
  }
}

const actionTexts: Record<Action, { title: string; text: string; danger: boolean }> = {
  retry: {
    title: 'Retry the workflow?',
    text: 'Argo runs the failed steps of the workflow again.',
    danger: false,
  },
  resubmit: {
    title: 'Resubmit the job?',
    text: 'Argo starts a new workflow with the same parameters. The job then points to the new workflow.',
    danger: false,
  },
  resume: {
    title: 'Resume the workflow?',
    text: 'Argo continues the suspended workflow.',
    danger: false,
  },
  stop: {
    title: 'Stop the workflow?',
    text: 'Argo terminates the running workflow. The job ends as failed.',
    danger: true,
  },
}

async function runAction(action: Action) {
  const texts = actionTexts[action]
  const label = action.charAt(0).toUpperCase() + action.slice(1)
  const jobId = job.value.id
  if (
    !(await confirm({
      ...texts,
      title: jobActionTitle(label, jobId, organism.value),
      confirmLabel: label,
    }))
  )
    return
  await perform(jobId, async () => {
    const r = await api[action](jobId)
    return `${label}: workflow ${r.workflow_name} is now ${r.phase.toLowerCase()}.`
  })
}

async function runDelete() {
  const jobId = job.value.id
  purgeData.value = false
  const confirmed = await confirm({
    title: jobActionTitle('Delete', jobId, organism.value),
    text: 'The Argo workflow and its pods are deleted and the job is marked as deleted. The statistics keep the job record.',
    confirmLabel: 'Delete',
    danger: true,
    // without data there is nothing left to delete in S3
    purgeOption: job.value.data_available,
  })
  if (!confirmed) return
  const purge = purgeData.value
  await perform(jobId, async () => {
    const r = await api.deleteJob(jobId, purge)
    const workflowText = r.deleted_workflow ? 'Workflow deleted' : 'No workflow to delete'
    return purge ? `${workflowText}, ${r.purged_objects} S3 objects deleted.` : `${workflowText}.`
  })
}

watch(id, () => {
  detail.value = undefined
  logs.value = undefined
  logsError.value = undefined
  logsDeleted.value = false
  result.value = undefined
  load()
})
load()
</script>
