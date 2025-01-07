<template>
  <ul class="list-group">
    <li class="list-group-item" v-for="d of downloads" :key="d.label">
      <a :href="d.url" class="me-2"><i class="bi bi-download"></i></a>
      <a :href="d.url"> {{ d.label }}</a>
    </li>
  </ul>
</template>
<script setup lang="ts">
import type { JobResult, ResultFileKey } from '@/model/job'
import { computed } from 'vue'

const props = defineProps<{
  job: JobResult
}>()

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
    TSVInterference: { label: 'tsv (interference)', position: 57 },
    FAAHypothetical: { label: 'faa (hypothetical)', position: 60 },
    PNGCircularPlot: { label: 'circular plot (png)', position: 70 },
    SVGCircularPlot: { label: 'circular plot (svg)', position: 80 },
    TXTLogs: { label: 'bakta logs', position: 90 },
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
</script>
