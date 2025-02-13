<template>
  <ul class="nav nav-tabs">
    <li v-for="e of tabs" :key="e.key" class="nav-item">
      <button
        class="nav-link"
        :class="{ active: e.key === currentTab }"
        @click="currentTab = e.key"
      >
        {{ e.label }}
      </button>
    </li>
    <li v-if="showShareButton" class="nav-item ms-auto">
      <button class="nav-link" @click="putLinkToClipboard" title="Copy link to clipboard">
        <i class="bi bi-share"></i>
      </button>
    </li>
    <li v-if="showAddJobButton" class="nav-item">
      <button
        class="nav-link text-secondary"
        @click="addJobToJoblist"
        title="Add this job your joblist"
      >
        <i class="bi bi-save2"></i>
      </button>
    </li>
  </ul>
  <div class="p-3 pb-5 pt-3 border border-top-0 my-0 py-0">
    <BaktaStats v-if="currentTab === 'job'" :data="bakta" :job="job" />
    <BaktaGenomeViewer v-if="currentTab === 'browser'" :data="bakta" />
    <BaktaAnnotationTable v-if="currentTab === 'table'" :data="bakta" />
    <FeaturePlotViewer v-if="currentTab === 'circular'" :bakta="bakta" />
    <BaktaDownloads v-if="currentTab === 'download'" :job="job" />
  </div>
  <div
    v-if="showShareButton"
    ref="copyToast"
    class="text-bg-secondary toast position-absolute px-2 py-1 bottom-0 end-0"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    Copied shareable link to clipboard
  </div>
  <div
    ref="addedToast"
    class="text-bg-secondary toast position-absolute px-2 py-1 bottom-0 end-0"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    Added the job to your joblist
  </div>
</template>
<script setup lang="ts">
import type { JobResult } from '@/model/job'
import type { Result } from '@/model/result-data'
import BaktaGenomeViewer from './BaktaGenomeViewer.vue'
import BaktaAnnotationTable from './BaktaAnnotationTable.vue'
import BaktaStats from './BaktaStats.vue'
import { computed, ref, useTemplateRef } from 'vue'
import { Toast } from 'bootstrap'
import FeaturePlotViewer from './FeaturePlotViewer.vue'
import BaktaDownloads from './BaktaDownloads.vue'

const props = defineProps<{
  job: JobResult
  bakta: Result
  showShareButton: boolean
  showAddJobButton: boolean
}>()
const emit = defineEmits<{
  (e: 'addJob'): void
}>()
type tabs = 'job' | 'table' | 'browser' | 'circular' | 'download'

type TabDefinition = {
  key: tabs
  label: string
}

const tabs = computed<TabDefinition[]>(() => {
  const tabs: TabDefinition[] = [
    {
      key: 'job',
      label: 'Job statistics',
    },
    {
      key: 'table',
      label: 'Annotation table',
    },
    {
      key: 'browser',
      label: 'Genomeviewer',
    },
    {
      key: 'circular',
      label: 'Circular plot',
    },
  ]

  if (Object.keys(props.job.ResultFiles).length > 1)
    tabs.push({
      key: 'download',
      label: 'Downloads',
    })
  return tabs
})
const currentTab = ref<tabs>('job')
const toast = useTemplateRef('copyToast')
function putLinkToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  if (toast.value) {
    const t = Toast.getOrCreateInstance(toast.value, { autohide: true })
    t.show()
  }
}
const addedToast = useTemplateRef('addedToast')
function addJobToJoblist() {
  emit('addJob')
  if (addedToast.value) {
    const t = Toast.getOrCreateInstance(addedToast.value, { autohide: true })
    t.show()
  }
}
</script>
