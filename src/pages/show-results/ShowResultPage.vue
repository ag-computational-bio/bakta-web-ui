<template>
  <div class="container flex-grow-1 d-flex">
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
    <div
      v-if="jobNotFinished"
      class="d-flex align-self-stretch w-100 justify-content-center align-items-center text-secondary"
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
            job?.jobStatus
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
    <div class="flex-grow-1">
      <ProgressBar v-if="loadingProgress" :progress="loadingProgress" />

      <div v-if="!loadingProgress && !error && data && result" class="mt-3">
        <BaktaResultVisualization
          :job="result"
          :bakta="data"
          :show-share-button="true"
          :show-add-job-button="!hasJob"
          @add-job="addJobToJoblist"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import BaktaResultVisualization from '@/components/bakta-result/BaktaResultVisualization.vue'
import Notification from '@/components/Notification.vue'
import { useProgress, type Progress } from '@/components/progress'
import ProgressBar from '@/components/ProgressBar.vue'
import { JobSchema, type JobResult } from '@/model/job'
import { parseBaktaData, type Result } from '@/model/result-data'
import type { JobInfo } from '@/model/submit'
import notifyFetchProgress from '@/notify-fetch-progress'
import { useBaktaService } from '@/page/page'
import { Toast } from 'bootstrap'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

const jobToken = computed(() => {
  const token = route.params.id
  if (!(typeof token == 'string')) {
    handleError("Can't process job token. Invalid format.")
    throw "Can't process job token. Invalid format."
  }
  return JobSchema.parse(JSON.parse(atob(token)))
})

const job = ref<JobInfo>()
const result = ref<JobResult>()
const data = ref<Result>()
const pollInterval = 2000
const loadingProgress = ref<Progress>()
const error = ref<string>()

const bakta = useBaktaService()
const route = useRoute()
const jobNotFinished = ref(true)
const jobStatusClass = computed(() => {
  if (job.value) {
    if (job.value.jobStatus === 'RUNNING') return 'success'
    return 'warning'
  }
  return 'danger'
})

const hasJob = ref<boolean>(false)
function addJobToJoblist() {
  bakta.addJob(jobToken.value)
  hasJob.value = true
}

function loadJobData() {
  hasJob.value = bakta.hasJob(jobToken.value)
  bakta
    .job(jobToken.value)
    .then((j) => {
      job.value = j
      const status = job.value.jobStatus
      if (status === 'SUCCESSFULL' || status === 'SUCCESSFUL' || status === 'ERROR') {
        jobNotFinished.value = false
        //  jobs is in finished state. No retry required
        console.debug('Jobs is finished or failed, no need to refresh', job.value)
        return bakta.result(jobToken.value).then((r) => {
          result.value = r
          if (r.ResultFiles.JSON == undefined) throw 'No json result available'
          return fetchResultFile(r.ResultFiles.JSON)
        })
      } else {
        console.debug('Job is still running, need to refresh', job.value)
        jobNotFinished.value = true
        // trigger reload
        window.setTimeout(() => {
          loadJobData()
        }, pollInterval)
      }
    })
    .catch(handleError)
}
function handleError(err: string) {
  error.value = err
}

function fetchResultFile(url: string): Promise<Result> {
  const { progress, updateProgress } = useProgress({ min: 0, max: 1 })
  loadingProgress.value = progress
  return fetch(url)
    .then((response) =>
      notifyFetchProgress(response, updateProgress, () => {
        if (loadingProgress.value) {
          loadingProgress.value.title = 'Processing data. This may take a while for larger genomes.'
          loadingProgress.value.type = 'indeterminate'
        }
      }),
    )
    .then((stream) => new Response(stream))
    .then((response) => response.text())
    .then((text) => {
      try {
        const json = JSON.parse(text)
        return parseBaktaData(json)
      } catch {
        try {
          const json = JSON.parse(text.replace(/:\s?NaN/g, ': null'))
          return parseBaktaData(json)
        } catch (ex2) {
          return Promise.reject(ex2)
        }
      }
    })
    .then((x) => {
      if (loadingProgress.value) loadingProgress.value = undefined
      data.value = x
      return x
    })
}
onMounted(loadJobData)
const toast = useTemplateRef('copyToast')
function putLinkToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  if (toast.value) {
    const t = Toast.getOrCreateInstance(toast.value, { autohide: true })
    t.show()
  }
}
</script>
<style scoped></style>
