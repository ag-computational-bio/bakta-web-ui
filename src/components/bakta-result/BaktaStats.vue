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
        <component
          :is="featureCount[type] ? 'a' : 'div'"
          v-for="type in column"
          :key="type"
          class="row py-1 feature-row"
          :href="featureCount[type] ? '#' : undefined"
          :title="
            featureCount[type]
              ? `Show all ${bakta.featureTypeLabel(type)} features in the annotation table`
              : undefined
          "
          @click="featureCount[type] && selectType($event, type)"
        >
          <div class="col-6 feature-label">{{ bakta.featureTypeLabel(type) }}</div>
          <div class="col-6 feature-value">{{ featureCount[type] }}</div>
        </component>
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

function selectType(event: Event, type: string) {
  event.preventDefault()
  emit('select:type', type)
}

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
.feature-row {
  border-radius: var(--bs-border-radius);
  color: var(--bs-body-color);
  text-decoration: none;
}
div.feature-row .feature-label {
  color: var(--bs-secondary-color);
}
a.feature-row .feature-label {
  color: var(--bs-link-color);
}
a.feature-row:hover {
  background-color: var(--bs-primary-bg-subtle);
}
a.feature-row:hover .feature-label {
  text-decoration: underline;
}
.feature-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.stat-panel {
  height: 100%;
  padding: 1rem 1.25rem;
  border-radius: var(--bs-border-radius-lg);
  background-color: var(--bakta-surface);
}
.stat-title {
  margin-bottom: 0.5rem;
  font-size: var(--bakta-font-size-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
}
</style>
