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
    <notification :message="error" />
    <div class="flex-grow-1">
      <div v-if="currentWorkflowKind" class="d-flex justify-content-end mt-3">
        <Shield v-bind="workflowShieldProps(currentWorkflowKind)">
          {{ formatWorkflowKind(currentWorkflowKind) }}
        </Shield>
      </div>

      <div
        v-if="jobNotFinished"
        class="d-flex align-self-stretch w-100 justify-content-center align-items-center text-secondary py-5"
      >
        <div
          class="spinner-grow me-4"
          :class="`text-${jobStatusClass}`"
          style="
            --bs-spinner-animation-speed: 2s;
            --bs-spinner-border-width: 0.7rem;
            --bs-spinner-height: 9rem;
            --bs-spinner-width: 9rem;
          "
        ></div>
        <div class="fs-1 fw-semibold d-flex flex-column align-items-end">
          <div class="mb-2">
            Your job is not finished yet.
            <br />
            Current status:
            <span class="px-3 py-1 rounded-2" :class="`text-bg-${jobStatusClass}`">{{
              job?.jobStatus ?? 'INIT'
            }}</span>
          </div>
          <button
            class="btn btn-outline-secondary fw-6 border-0"
            @click="putLinkToClipboard"
            title="Copy link to clipboard"
          >
            Copy link to clipboard <i class="bi bi-share"></i>
          </button>
        </div>
      </div>

      <div v-if="job?.jobStatus === 'ERROR'" class="mt-4">
        <div class="alert alert-danger">This workflow failed.</div>
      </div>

      <ProgressBar v-if="loadingProgress" :progress="loadingProgress" />

      <div v-if="!loadingProgress && !error && data && result" class="mt-3">
        <BaktaResultVisualization
          :job="result"
          :bakta="data"
          :show-share-button="true"
          :show-add-job-button="!hasJob"
          @add-job="addJobToJoblist"
        />

        <div v-if="showRunBaktfold" class="mt-4 mb-5">
          <div class="border rounded-3 p-4 bg-body-tertiary">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h5 class="mb-1"><i class="bi bi-stars me-2"></i>Run Baktfold</h5>
                <p class="text-secondary mb-0">
                  This job was run without Baktfold. Submit the result JSON to run protein structure
                  prediction as a standalone Baktfold workflow.
                </p>
              </div>
              <button
                class="btn btn-warning text-dark fw-semibold"
                :disabled="submittingBaktfold"
                @click="runBaktfold"
              >
                <template v-if="!submittingBaktfold">
                  <i class="bi bi-stars me-1"></i> Run Baktfold
                </template>
                <template v-else>
                  <span
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Submitting...
                </template>
              </button>
            </div>
            <notification v-if="baktfoldError" class="mt-3" :message="baktfoldError" />
          </div>
        </div>
      </div>

      <div v-if="!loadingProgress && !error && !data && result" class="mt-3">
        <div class="border rounded-3 p-3">
          <h5 class="mb-3">Downloads</h5>
          <BaktaDownloads :job="result" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import BaktaResultVisualization from '@/components/bakta-result/BaktaResultVisualization.vue'
import BaktaDownloads from '@/components/bakta-result/BaktaDownloads.vue'
import { useProgress, type Progress } from '@/components/progress'
import ProgressBar from '@/components/ProgressBar.vue'
import { JobSchema, formatWorkflowKind, workflowShieldProps, type JobResult } from '@/model/job'
import { workflowRouteName } from '@/model/bakta-service'
import { parseBaktaData, type Result } from '@/model/result-data'
import type { JobInfo } from '@/model/submit'
import notifyFetchProgress from '@/notify-fetch-progress'
import { useBaktaService } from '@/page/page'
import { Toast } from 'bootstrap'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const pollInterval = 2000

const bakta = useBaktaService()
const route = useRoute()
const router = useRouter()

const jobToken = computed(() => {
  const token = route.params.id
  if (typeof token !== 'string') {
    handleError("Can't process job token. Invalid format.")
    throw "Can't process job token. Invalid format."
  }
  return JobSchema.parse(JSON.parse(atob(token)))
})

const job = ref<JobInfo>()
const result = ref<JobResult>()
const data = ref<Result>()
const loadingProgress = ref<Progress>()
const error = ref<string>()
const jobNotFinished = ref(true)
const reloadHandle = ref<number>()

const jobStatusClass = computed(() => {
  if (job.value) {
    if (job.value.jobStatus === 'RUNNING') return 'success'
    return 'warning'
  }
  return 'danger'
})

const currentWorkflowKind = computed(() => job.value?.workflowKind ?? result.value?.workflowKind)

const hasJob = ref<boolean>(false)
const baktfoldAvailable = ref(false)
const submittingBaktfold = ref(false)
const baktfoldError = ref<string>()

const showRunBaktfold = computed(() => {
  if (!result.value || !data.value) return false
  if (!baktfoldAvailable.value) return false
  const kind = result.value.workflowKind
  return kind === 'bakta'
})

function addJobToJoblist() {
  bakta.addJob({
    ...jobToken.value,
    workflowKind: currentWorkflowKind.value ?? jobToken.value.workflowKind,
  })
  hasJob.value = true
}

function checkBaktfoldAvailability() {
  bakta
    .workflows()
    .then((workflows) => {
      baktfoldAvailable.value = workflows.some((w) => w.workflowKind === 'baktfold')
    })
    .catch(() => {
      baktfoldAvailable.value = false
    })
}

async function runBaktfold() {
  if (!result.value?.ResultFiles.JSON) return
  submittingBaktfold.value = true
  baktfoldError.value = undefined
  try {
    const response = await fetch(result.value.ResultFiles.JSON)
    if (!response.ok) throw 'Failed to download the result JSON'
    const blob = await response.blob()
    const fileName = `${result.value.name || 'bakta-result'}.json`
    const file = new File([blob], fileName, { type: 'application/json' })
    const newJob = await bakta.submitJob({
      workflowKind: 'baktfold',
      jobName: result.value.name || 'Baktfold',
      baktaJson: file,
    })
    router.push({ name: workflowRouteName(newJob.workflowKind), params: { id: newJob.key } })
  } catch (err) {
    baktfoldError.value = `${err}`
    submittingBaktfold.value = false
  }
}

function scheduleReload() {
  reloadHandle.value = window.setTimeout(() => {
    loadJobData()
  }, pollInterval)
}

async function loadJobData() {
  hasJob.value = bakta.hasJob(jobToken.value)
  error.value = undefined
  try {
    const jobInfo = await bakta.job(jobToken.value)
    job.value = jobInfo
    const status = jobInfo.jobStatus

    if (status === 'SUCCESSFULL' || status === 'SUCCESSFUL') {
      jobNotFinished.value = false
      const jobResult = await bakta.result(jobToken.value)
      result.value = jobResult
      if (jobResult.ResultFiles.JSON != undefined) {
        await fetchResultFile(jobResult.ResultFiles.JSON)
      }
      return
    }

    if (status === 'ERROR') {
      jobNotFinished.value = false
      return
    }

    jobNotFinished.value = true
    scheduleReload()
  } catch (err) {
    handleError(`${err}`)
  }
}

function handleError(err: string) {
  error.value = err
}

async function fetchResultFile(url: string): Promise<void> {
  const { progress, updateProgress } = useProgress({ min: 0, max: 1 })
  loadingProgress.value = progress
  try {
    const stream = await fetch(url).then((response) =>
      notifyFetchProgress(response, updateProgress, () => {
        if (loadingProgress.value) {
          loadingProgress.value.title = 'Processing data. This may take a while for larger genomes.'
          loadingProgress.value.type = 'indeterminate'
        }
      }),
    )
    const text = await new Response(stream).text()
    try {
      data.value = parseBaktaData(JSON.parse(text))
    } catch {
      data.value = parseBaktaData(JSON.parse(text.replace(/:\s?NaN/g, ': null')))
    }
  } catch (err) {
    console.error('Failed to parse result JSON:', err)
  } finally {
    loadingProgress.value = undefined
  }
}

onMounted(() => {
  loadJobData()
  checkBaktfoldAvailability()
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
