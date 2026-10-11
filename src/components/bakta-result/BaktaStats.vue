<template>
  <div class="row g-3 mb-3">
    <div class="col-lg-4">
      <section class="stat-panel">
        <h2 class="stat-title">Input</h2>
        <display-tuple label="Organism" :value="name" />
        <display-tuple label="Sequences" :value="sequencesCount" />
        <display-tuple label="Genome size" :value="size" />
      </section>
    </div>

    <div v-if="job" class="col-lg-4">
      <section class="stat-panel">
        <h2 class="stat-title">Runtime</h2>
        <display-tuple label="Start" :value="started" />
        <display-tuple label="Stop" :value="ended" />
        <display-tuple label="Duration" :value="duration" />
      </section>
    </div>

    <div class="col-lg-4">
      <section class="stat-panel">
        <h2 class="stat-title">Statistics</h2>
        <display-tuple label="N50" :value="formatBp(data.stats.n50, 'bp')" />
        <display-tuple v-if="data.stats.n90" label="N90" :value="formatBp(data.stats.n90, 'bp')" />
        <display-tuple label="GC-content" :value="formatGc(data.stats.gc)" />
        <display-tuple label="Coding ratio" :value="formatGc(data.stats.coding_ration)" />
        <display-tuple label="N-ratio" :value="formatGc(data.stats.n_ratio)" />
      </section>
    </div>
  </div>

  <section class="stat-panel">
    <h2 class="stat-title">Feature counts (Total: {{ data.features.length }})</h2>
    <div class="row">
      <div v-for="(column, idx) in featureColumns" :key="idx" class="col-md-4">
        <button
          v-for="type in column"
          :key="type"
          type="button"
          class="feature-count"
          :disabled="!featureCount[type]"
          :title="`Show all ${bakta.featureTypeLabel(type)} features in the annotation table`"
          @click="emit('select:type', type)"
        >
          <display-tuple
            :break="6"
            :label="bakta.featureTypeLabel(type)"
            :value="featureCount[type]"
          />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import bakta from '@/bakta-helper'
import DisplayTuple from '@/components/DisplayTuple.vue'
import type { JobResult } from '@/model/job'
import type { Result } from '@/model/result-data'
import humanizeDuration from 'humanize-duration'
import { computed } from 'vue'
import { formatBp } from './feature-plot/circluar-plot/formatters'
import { formatGc } from './feature-plot/formatters'

const props = withDefaults(
  defineProps<{
    data: Result
    job: JobResult
  }>(),
  {},
)
const emit = defineEmits<{
  (e: 'select:type', type: string): void
}>()

const featureColumns = [
  ['tRNA', 'tmRNA', 'rRNA', 'ncRNA'],
  ['ncRNA-region', 'crispr', 'cds', 'sorf'],
  ['oriC', 'oriV', 'oriT', 'gap'],
]

const name = computed(() => bakta.genomeName(props.data))
const size = computed(() => bakta.formattedSize(props.data))
const featureCount = computed(() => bakta.featureCount(props.data))
const sequencesCount = computed(() => bakta.sequencesCountString(props.data))
const started = computed(() => formatDate(props.job.started))
const ended = computed(() => formatDate(props.job.updated))
const duration = computed(() => formatDuration(props.job.started, props.job.updated))

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatDuration(from: string, to: string) {
  return humanizeDuration(new Date(to).getTime() - new Date(from).getTime())
}
</script>

<style scoped>
.feature-count {
  display: block;
  width: 100%;
  padding: 0 0.5rem;
  border: 0;
  border-radius: var(--bs-border-radius);
  background: none;
  color: inherit;
  text-align: start;
}
.feature-count:not(:disabled):hover {
  background-color: var(--bs-primary-bg-subtle);
}
.feature-count:disabled {
  cursor: default;
}
.stat-panel {
  height: 100%;
  padding: 1rem 1.25rem;
  border-radius: var(--bs-border-radius-lg);
  background-color: var(--bakta-surface);
}
.stat-title {
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
}
</style>
