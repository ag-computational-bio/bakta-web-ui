<template>
  <div class="container flex-grow-1">
    <notification :message="error" />
    <ProgressBar v-if="loadingProgress" :progress="loadingProgress" />

    <div v-if="!loadingProgress && !error && data && result" class="mt-3">
      <BaktaResultVisualization :job="result" :bakta="data" :show-share-button="true" />
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
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const job = ref<JobInfo>()
const result = ref<JobResult>()
const data = ref<Result>()
const pollInterval = 2000
const loadingProgress = ref<Progress>()
const error = ref<string>()

const bakta = useBaktaService()
const route = useRoute()

function loadJobData() {
  const token = route.params.id
  if (!(typeof token == 'string')) {
    loadingProgress.value = undefined
    handleError("Can't process job token. Invalid format.")
    return
  }
  const jobToken = JobSchema.parse(JSON.parse(atob(token)))
  bakta
    .job(jobToken)
    .then((j) => {
      job.value = j
      const status = job.value.jobStatus
      if (status === 'SUCCESSFULL' || status === 'ERROR') {
        //  jobs is in finished state. No retry required
        console.debug('Jobs is finished or failed, no need to refresh', job.value)
        return bakta.result(jobToken).then((r) => {
          result.value = r
          if (r.ResultFiles.JSON == undefined) throw 'No json result available'
          return fetchResultFile(r.ResultFiles.JSON)
        })
      } else {
        console.debug('Job is still running, need to refresh', job.value)
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
</script>
<style scoped></style>
