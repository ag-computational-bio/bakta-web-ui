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
      <button class="nav-link" @click="putLinkToClipboard">
        <i title="Copy link to clipboard" class="bi bi-share"></i>
      </button>
    </li>
  </ul>
  <div class="p-3 pb-5 pt-3 border border-top-0 my-0 py-0">
    <BaktaStats v-if="currentTab === 'job'" :data="bakta" :job="job" />
    <BaktaGenomeViewer v-if="currentTab === 'browser'" :data="bakta" />
    <BaktaAnnotationTable v-if="currentTab === 'table'" :data="bakta" />
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
</template>
<script setup lang="ts">
import type { JobResult } from '@/model/job'
import type { Result } from '@/model/result-data'
import BaktaGenomeViewer from './BaktaGenomeViewer.vue'
import BaktaAnnotationTable from './BaktaAnnotationTable.vue'
import BaktaStats from './BaktaStats.vue'
import { ref, useTemplateRef } from 'vue'
import { Toast } from 'bootstrap'

defineProps<{
  job: JobResult
  bakta: Result
  showShareButton: boolean
}>()
type tabs = 'job' | 'table' | 'browser' | 'circular'

const tabs: { key: tabs; label: string }[] = [
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
]
const currentTab = ref<tabs>('job')
const toast = useTemplateRef('copyToast')
function putLinkToClipboard() {
  window.navigator.clipboard.writeText(window.location.href)
  if (toast.value) {
    const t = Toast.getOrCreateInstance(toast.value, { autohide: true })
    t.show()
  }
}
</script>
