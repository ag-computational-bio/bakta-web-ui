<template>
  <div class="container flex-grow-1 d-flex page-body">
    <div
      ref="copyToast"
      class="text-bg-secondary toast position-absolute px-2 py-1 bottom-0 end-0"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      Copied shareable link to clipboard
    </div>
    <Notification :message="error" />

    <div class="flex-grow-1">
      <div v-if="jobNotFinished && currentWorkflowKind" class="d-flex justify-content-end mt-3">
        <Shield v-bind="workflowShieldProps(currentWorkflowKind)">
          {{ formatWorkflowKind(currentWorkflowKind) }}
        </Shield>
      </div>

      <JobPendingCard
        v-if="jobNotFinished"
        :job-status="job?.jobStatus"
        :stages="pendingStages"
        :show-share-button="true"
        @share="putLinkToClipboard"
      />

      <template v-if="!jobNotFinished && (job || result)">
        <div class="d-flex justify-content-between align-items-center mb-4 mt-3">
          <div>
            <h2 class="h4 mb-1">{{ job?.name ?? result?.name ?? 'Bakta Proteins' }}</h2>
            <div class="text-secondary">Standalone protein annotation workflow summary</div>
          </div>
          <Shield v-bind="workflowShieldProps('bakta_proteins')">
            {{ formatWorkflowKind('bakta_proteins') }}
          </Shield>
        </div>

        <div class="row g-4">
          <div class="col-lg-4">
            <div class="border rounded-3 p-3 h-100">
              <h5 class="mb-3">Job summary</h5>
              <DisplayTuple
                v-if="job?.name || result?.name"
                label="Name"
                :value="job?.name ?? result?.name ?? ''"
              />
              <DisplayTuple v-if="job" label="Status" :value="job.jobStatus" />
              <DisplayTuple
                v-if="job?.started || result?.started"
                label="Started"
                :value="formatDateTime(job?.started ?? result?.started ?? '')"
              />
              <DisplayTuple
                v-if="job?.updated || result?.updated"
                label="Updated"
                :value="formatDateTime(job?.updated ?? result?.updated ?? '')"
              />
            </div>
          </div>

          <div class="col-lg-8 d-flex flex-column gap-4">
            <div v-if="result" class="border rounded-3 p-3">
              <h5 class="mb-3">Downloads</h5>
              <BaktaDownloads :job="result" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import DisplayTuple from '@/components/DisplayTuple.vue'
import JobPendingCard from '@/components/JobPendingCard.vue'
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import BaktaDownloads from '@/components/bakta-result/BaktaDownloads.vue'
import { JobSchema, formatWorkflowKind, workflowShieldProps, type JobResult } from '@/model/job'
import type { JobInfo, StageLog, WorkflowDescriptor } from '@/model/submit'
import { useBaktaService } from '@/page/page'
import { Toast } from 'bootstrap'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { buildPendingWorkflowStages } from './pending-job-stages'

const pollInterval = 2000

const bakta = useBaktaService()
const route = useRoute()

const jobToken = computed(() => {
  const token = route.params.id
  if (typeof token !== 'string') throw "Can't process job token. Invalid format."
  return JobSchema.parse(JSON.parse(atob(token)))
})

const job = ref<JobInfo>()
const result = ref<JobResult>()
const error = ref<string>()
const workflowStages = ref<StageLog[]>([])
const workflowDescriptors = ref<WorkflowDescriptor[]>([])
const jobNotFinished = computed(() => {
  const status = job.value?.jobStatus
  return (
    status !== undefined &&
    status !== 'SUCCESSFULL' &&
    status !== 'SUCCESSFUL' &&
    status !== 'ERROR'
  )
})
const reloadHandle = ref<number>()
const currentWorkflowKind = computed(() => job.value?.workflowKind ?? result.value?.workflowKind)
const pendingStages = computed(() =>
  buildPendingWorkflowStages(
    currentWorkflowKind.value,
    workflowDescriptors.value,
    workflowStages.value,
    job.value?.jobStatus,
  ),
)

function scheduleReload() {
  reloadHandle.value = window.setTimeout(() => {
    loadJobData()
  }, pollInterval)
}

async function loadJobData() {
  error.value = undefined
  try {
    const jobInfo = await bakta.job(jobToken.value)
    job.value = jobInfo

    if (jobInfo.jobStatus === 'SUCCESSFULL' || jobInfo.jobStatus === 'SUCCESSFUL') {
      const jobResult = await bakta.result(jobToken.value)
      result.value = jobResult
      return
    }

    if (jobInfo.jobStatus === 'ERROR') {
      return
    }

    await fetchLogs()
    scheduleReload()
  } catch (err) {
    error.value = `${err}`
  }
}

async function fetchLogs() {
  try {
    const logs = await bakta.logsForJob(jobToken.value)
    workflowStages.value = logs.stages
  } catch {
    // Logs may not be available yet
  }
}

function loadWorkflowMetadata() {
  bakta
    .workflows()
    .then((workflows) => {
      workflowDescriptors.value = workflows
    })
    .catch(() => {
      workflowDescriptors.value = []
    })
}

function formatDateTime(datestring: string): string {
  if (!datestring) return ''
  try {
    const date = Date.parse(datestring)
    return new Intl.DateTimeFormat([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch (err) {
    return `Unable to format: '${datestring}'. Error: ${err}`
  }
}

onMounted(() => {
  loadJobData()
  loadWorkflowMetadata()
})

onUnmounted(() => {
  if (reloadHandle.value) window.clearTimeout(reloadHandle.value)
})

const toast = useTemplateRef('copyToast')

function putLinkToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  if (toast.value) {
    const t = Toast.getOrCreateInstance(toast.value, { autohide: true })
    t.show()
  }
}
</script>
