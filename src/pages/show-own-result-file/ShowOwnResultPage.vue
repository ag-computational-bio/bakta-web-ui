<template>
  <div class="container flex-grow-1">
    <notification
      message="You can visualize bakta json files with this viewer. The data is visualized inside your browser. None of your data is send to the server."
      type="warning"
    />
    <div class="mb-3">
      <div class="input-group">
        <input
          class="form-control"
          type="file"
          id="bakta-json"
          @change="jsonFileChanged"
          accept=".json"
        />
      </div>
      <div>
        <span class="ms-1 text-sm text-secondary">Use example result: </span>
        <button
          class="btn btn-sm border-0 py-0 text-sm btn-outline-secondary"
          @click="loadExampleData('plasmid')"
        >
          Plasmid
        </button>
        <button
          class="btn btn-sm border-0 py-0 text-sm btn-outline-secondary"
          @click="loadExampleData('genome')"
        >
          Genome
        </button>
      </div>
    </div>
    <notification type="danger" :message="error" />
    <progress-bar
      v-if="loadingProgress.enabled"
      :progress="loadingProgress"
      :title="loadingProgress.title"
      :show-label="loadingProgress.showLabel"
    />
    <div v-if="!loadingProgress.enabled && data">
      <BaktaResultVisualization
        :job="job"
        :bakta="data"
        :show-share-button="false"
        :show-add-job-button="false"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import BaktaResultVisualization from '@/components/bakta-result/BaktaResultVisualization.vue'
import { type Progress } from '@/components/progress'
import { type JobResult } from '@/model/job'
import { parseBaktaData, type Result } from '@/model/result-data'
import notifyFetchProgress from '@/notify-fetch-progress'
import { computed, ref } from 'vue'

const data = ref<Result>()
const job = computed<JobResult>(() => {
  return {
    jobID: '',
    name: '',
    ResultFiles: {},
    started: new Date().toISOString(),
    updated: new Date().toISOString(),
  }
})
const loadingProgress = ref<Progress & { enabled: boolean; title: string; showLabel: boolean }>({
  enabled: false,
  min: 0,
  max: 100,
  value: 0,
  showLabel: true,
  title: 'Loading results...',
  type: 'static',
})

function jsonFileChanged(evt: Event) {
  if (evt.target instanceof HTMLInputElement && evt.target.files) {
    if (evt.target.files?.length == 0) {
      data.value = undefined
    } else {
      const f = evt.target.files.item(0)
      if (f) loadData(f)
    }
  }
}

function loadData(file: File) {
  error.value = undefined
  loadingProgress.value.enabled = true
  loadingProgress.value.value = 0
  loadingProgress.value.showLabel = true
  loadingProgress.value.title = 'Processing data. This may take a while for larger genomes.'
  loadingProgress.value.type = 'indeterminate'

  const reader = new FileReader()
  reader.onload = function (event) {
    if (event.target == null || !(typeof event.target.result == 'string')) {
      setError('Loading data failed')
      return
    }
    try {
      const json = JSON.parse(event.target.result)
      const parsed = parseBaktaData(json)
      data.value = parsed
    } catch (err) {
      console.error(err)
      setError('The provided file output is not supported')
    }
    loadingProgress.value.enabled = false
  }
  reader.readAsText(file)
}

const error = ref<string>()
function setError(err: string) {
  error.value = err
  loadingProgress.value.enabled = false
}

const examples = {
  plasmid: '/NC_002127.1.json.gz',
  genome: '/GCF_000008865.2.json.gz',
} as const

function loadExampleData(type: 'plasmid' | 'genome') {
  loadingProgress.value.enabled = true
  loadingProgress.value.type = 'indeterminate'
  loadingProgress.value.showLabel = false
  loadingProgress.value.value = 100

  fetch(examples[type])
    .then((response) =>
      notifyFetchProgress(
        response,
        () => {},
        () => {},
      ),
    )
    .then((stream) => new Response(stream))
    .then((r) => r.json())
    .then((j) => {
      data.value = parseBaktaData(j)
      loadingProgress.value.enabled = false
    })
    .catch((err) => {
      console.warn(err)
      loadingProgress.value.enabled = false
    })
}
</script>
<style scoped></style>
