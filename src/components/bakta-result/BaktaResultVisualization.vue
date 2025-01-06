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
  </ul>
  <div class="p-3 pb-5 pt-3 border border-top-0 my-0 py-0">
    <BaktaStats v-if="currentTab === 'job'" :data="bakta" :job="job" />
    <BaktaGenomeViewer v-if="currentTab === 'browser'" :data="bakta" />
    <BaktaAnnotationTable v-if="currentTab === 'table'" :data="bakta" />
  </div>
</template>
<script setup lang="ts">
import type { JobResult } from '@/model/job'
import type { Result } from '@/model/result-data'
import BaktaGenomeViewer from './BaktaGenomeViewer.vue'
import BaktaAnnotationTable from './BaktaAnnotationTable.vue'
import BaktaStats from './BaktaStats.vue'
import { ref } from 'vue'

defineProps<{
  job: JobResult
  bakta: Result
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
</script>
