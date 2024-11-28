<template>
  <div class="row mb-5">
    <div class="col-md-6">
      <h5>Input</h5>
      <display-tuple label="Organism:" :value="name" />
      <display-tuple label="Sequences:" :value="sequencesCount" />
      <display-tuple label="Genome size:" :value="size" />
    </div>

    <div v-if="job" class="col-md-6">
      <h5>Runtime</h5>
      <display-tuple label="Start:" :value="started" />
      <display-tuple label="Stop:" :value="ended" />
      <display-tuple label="Duration:" :value="duration" />
    </div>
  </div>

  <div class="row mb-5">
    <div class="col-md-10">
      <h5>Output</h5>
      <div class="row">
        <div class="col-md-4">
          <display-tuple :break="6" label="tRNA:" :value="featureCount['tRNA']" />
          <display-tuple :break="6" label="tmRNA:" :value="featureCount['tmRNA']" />
          <display-tuple :break="6" label="rRNA:" :value="featureCount['rRNA']" />
          <display-tuple :break="6" label="ncRNA:" :value="featureCount['ncRNA']" />
        </div>
        <div class="col-md-4">
          <display-tuple :break="6" label="ncRNA regions:" :value="featureCount['ncRNA-region']" />
          <display-tuple :break="6" label="CRISPR:" :value="featureCount['crispr']" />
          <display-tuple :break="6" label="CDS:" :value="featureCount['cds']" />
          <display-tuple :break="6" label="sORF:" :value="featureCount['sorf']" />
        </div>
        <div class="col-md-4">
          <display-tuple :break="6" label="oriC:" :value="featureCount['oriC']" />
          <display-tuple :break="6" label="oriV:" :value="featureCount['oriV']" />
          <display-tuple :break="6" label="oriT:" :value="featureCount['oriT']" />
          <display-tuple :break="6" label="gap:" :value="featureCount['gap']" />
        </div>
        <div class="col-md-3"></div>
      </div>
    </div>
  </div>
  <div v-if="job" class="row">
    <h5>Downloads</h5>
    <div class="col-12">
      <template v-for="d in downloads" :key="d.key">
        <a :href="d.url" class="text-no-wrap">
          <span class="me-3">{{ d.label }}</span>
        </a>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import bakta from '@/bakta-helper'
import DisplayTuple from '@/components/DisplayTuple.vue'
import type { Result } from '@/model/result-data'
import type { JobResult, ResultFileKey } from '@/model/job'
import humanizeDuration from 'humanize-duration'
import { computed } from 'vue'

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

const downloads = computed(() => {
  type Count = { label: string; position: number }
  const order: Record<ResultFileKey, Count> = {
    TSV: { label: 'tsv', position: 0 },
    GFF3: { label: 'gff3', position: 10 },
    GBFF: { label: 'gbff', position: 20 },
    EMBL: { label: 'embl', position: 25 },
    FFN: { label: 'ffn', position: 30 },
    FAA: { label: 'faa', position: 35 },
    FNA: { label: 'fna', position: 40 },
    JSON: { label: 'json', position: 50 },
    TSVHypothetical: { label: 'tsv (hypothetical)', position: 55 },
    FAAHypothetical: { label: 'faa (hypothetical)', position: 60 },
  }
  const resultFiles: Record<string, string> =
    props.job && props.job.ResultFiles ? props.job.ResultFiles : {}

  const l: { key: string; label: string; position: number; url: string }[] = []
  for (const k of Object.keys(resultFiles)) {
    if (k in order) {
      const _k = k as ResultFileKey
      l.push({ key: k, url: resultFiles[_k], ...order[_k] })
    } else {
      l.push({ key: k, label: k, position: 1000, url: resultFiles[k] })
    }
  }
  return l.sort((a, b) => a.position - b.position)
})

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
