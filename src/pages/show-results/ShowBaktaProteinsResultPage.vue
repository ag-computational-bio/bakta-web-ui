<template>
  <div class="container flex-grow-1 page-body">
    <Notification :message="error" />

    <div v-if="job || result" class="d-flex justify-content-between align-items-center mb-4 mt-3">
      <div>
        <h2 class="h4 mb-1">{{ job?.name ?? result?.name ?? 'Bakta Proteins' }}</h2>
        <div class="text-secondary">Standalone protein annotation workflow summary</div>
      </div>
      <Shield v-bind="workflowShieldProps('bakta_proteins')">
        {{ formatWorkflowKind('bakta_proteins') }}
      </Shield>
    </div>

    <div
      v-if="jobNotFinished"
      class="d-flex align-items-center justify-content-center text-secondary py-5 gap-4"
    >
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div>
        <div class="fs-5 fw-semibold">Your job is still running.</div>
        <div>Current status: {{ job?.jobStatus ?? 'INIT' }}</div>
      </div>
    </div>
    <div v-if="job || result" class="row g-4">
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
  </div>
</template>

<script setup lang="ts">
import DisplayTuple from '@/components/DisplayTuple.vue'
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import BaktaDownloads from '@/components/bakta-result/BaktaDownloads.vue'
import { JobSchema, formatWorkflowKind, workflowShieldProps, type JobResult } from '@/model/job'
import type { JobInfo } from '@/model/submit'
import { useBaktaService } from '@/page/page'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

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

    scheduleReload()
  } catch (err) {
    error.value = `${err}`
  }
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

onMounted(loadJobData)

onUnmounted(() => {
  if (reloadHandle.value) window.clearTimeout(reloadHandle.value)
})
</script>
