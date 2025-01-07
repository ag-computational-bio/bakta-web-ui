<template>
  <div class="row mb-5">
    <div class="col-md-6 col-sm-12">
      <h5>Input</h5>
      <display-tuple label="Organism:" :value="name" />
      <display-tuple label="Sequences:" :value="sequencesCount" />
      <display-tuple label="Genome size:" :value="size" />
    </div>

    <div v-if="job" class="col-md-6 col-sm-12">
      <h5>Runtime</h5>
      <display-tuple label="Start:" :value="started" />
      <display-tuple label="Stop:" :value="ended" />
      <display-tuple label="Duration:" :value="duration" />
    </div>
  </div>

  <div class="row mb-5">
    <div class="col-12">
      <h5>Statistics</h5>
      <div class="row mb-4">
        <div class="col-md-4 col-sm-12">
          <display-tuple :break="6" label="N50" :value="formatBp(data.stats.n50, 'bp')" />
          <display-tuple :break="6" label="GC-content" :value="formatGc(data.stats.gc)" />
          <display-tuple
            :break="6"
            label="Coding ratio"
            :value="formatGc(data.stats.coding_ration)"
          />
          <display-tuple :break="6" label="N-ratio" :value="formatGc(data.stats.n_ratio)" />
        </div>
      </div>
      <h5>Feature counts (Total: {{ data.features.length }})</h5>
      <div class="row">
        <div class="col-md-4 col-sm-12">
          <display-tuple :break="6" label="tRNA:" :value="featureCount['tRNA']" />
          <display-tuple :break="6" label="tmRNA:" :value="featureCount['tmRNA']" />
          <display-tuple :break="6" label="rRNA:" :value="featureCount['rRNA']" />
          <display-tuple :break="6" label="ncRNA:" :value="featureCount['ncRNA']" />
        </div>
        <div class="col-md-4 col-sm-12">
          <display-tuple :break="6" label="ncRNA regions:" :value="featureCount['ncRNA-region']" />
          <display-tuple :break="6" label="CRISPR:" :value="featureCount['crispr']" />
          <display-tuple :break="6" label="CDS:" :value="featureCount['cds']" />
          <display-tuple :break="6" label="sORF:" :value="featureCount['sorf']" />
        </div>
        <div class="col-md-4 col-sm-12">
          <display-tuple :break="6" label="oriC:" :value="featureCount['oriC']" />
          <display-tuple :break="6" label="oriV:" :value="featureCount['oriV']" />
          <display-tuple :break="6" label="oriT:" :value="featureCount['oriT']" />
          <display-tuple :break="6" label="gap:" :value="featureCount['gap']" />
        </div>
      </div>
    </div>
  </div>
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

const name = computed(() => bakta.genomeName(props.data))
const size = computed(() => bakta.formattedSize(props.data))
const featureCount = computed(() => bakta.featureCount(props.data))
const sequencesCount = computed(() => bakta.sequencesCountString(props.data))
const started = computed(() => formatDate(props.job.started))
const ended = computed(() => formatDate(props.job.updated))
const duration = computed(() => formatDuration(props.job.started, props.job.updated))

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatDuration(from: string, to: string) {
  return humanizeDuration(new Date(to).getTime() - new Date(from).getTime())
}
</script>

<style></style>
