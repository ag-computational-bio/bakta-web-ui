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
      <button class="btn btn-sm btn-outline-secondary border-0" @click="loadExampleData">
        Click here to use example result
      </button>
    </div>
    <notification type="danger" :message="error" />
    <progress-bar
      v-if="loadingProgress.enabled"
      :progress="loadingProgress"
      :title="loadingProgress.title"
    />

    <div v-if="!loadingProgress.enabled && data">
      <div class="mt-5">
        <h4>Job statistics</h4>
        <div class="" id="stats">
          <div class="card card-body">
            <bakta-stats :data="data" :job="job" />
          </div>
        </div>
      </div>
      <hr />
      <div class="row">
        <h4>Genomeviewer</h4>
        <div class="" id="genomeBrowser">
          <div class="card card-body">
            <bakta-genome-viewer ref="genomeview" :data="data" />
          </div>
        </div>
      </div>
      <hr />
      <h4>Annotations</h4>
      <div class="" id="annotationTable">
        <div class="card card-body">
          <bakta-annotation-table :data="data" />
        </div>
      </div>
      <hr />
    </div>
  </div>
</template>
<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import BaktaGenomeViewer from '@/components/BaktaGenomeViewer.vue'
import BaktaStats from '@/components/BaktaStats.vue'
import BaktaAnnotationTable from '@/components/BaktaAnnotationTable.vue'
import { computed, ref } from 'vue'
import { parseBaktaData, type Result } from '@/model/result-data'
import { type JobResult } from '@/model/job'
import type { Progress } from '@/components/progress'

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
const loadingProgress = ref<Progress & { enabled: boolean; title: string }>({
  enabled: false,
  min: 0,
  max: 100,
  value: 0,
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

function loadExampleData() {
  fetch('/NC_002127.1.json')
    .then((r) => r.json())
    .then((j) => {
      data.value = parseBaktaData(j)
    })
    .catch((err) => console.warn(err))
}
</script>
<style scoped></style>
