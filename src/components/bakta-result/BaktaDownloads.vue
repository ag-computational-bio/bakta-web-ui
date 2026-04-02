<template>
  <table class="table">
    <tbody>
      <tr v-for="d of downloads" :key="d.label">
        <td>
          <a :href="d.url" class="me-2" download><i class="bi bi-download"></i></a>
          <a :href="d.url" download> {{ d.label }}</a>
        </td>
        <td>{{ d.description }}</td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts">
import { listDownloadResultFiles, type JobResult, type ResultFileKey } from '@/model/job'
import { computed } from 'vue'

const props = defineProps<{
  job: JobResult
}>()

const downloads = computed(() => {
  type Count = { label: string; position: number; description?: string }
  const order: Record<ResultFileKey, Count> = {
    TSV: {
      label: 'tsv',
      description: 'annotations as simple human readble TSV',
      position: 0,
    },
    GFF3: { label: 'gff3', description: 'annotations & sequences in GFF3 format', position: 10 },
    GBFF: {
      label: 'gbff',
      description: 'annotations & sequences in (multi) GenBank format',
      position: 20,
    },
    EMBL: {
      label: 'embl',
      description: 'annotations & sequences in (multi) EMBL format',
      position: 25,
    },
    FFN: { label: 'ffn', description: 'feature nucleotide sequences as FASTA', position: 30 },
    FAA: { label: 'faa', description: 'CDS/sORF amino acid sequences as FASTA', position: 35 },
    FNA: { label: 'fna', description: 'replicon/contig DNA sequences as FASTA', position: 40 },
    JSON: {
      label: 'json',
      description: 'all (internal) annotation & sequence information as JSON',
      position: 50,
    },
    TSVHypothetical: {
      label: 'tsv (hypothetical)',
      description:
        'further information on hypothetical protein CDS as simple human readble tab separated values',
      position: 55,
    },
    TSVInference: {
      label: 'tsv (inference)',
      description:
        'inference metrics (score, evalue, coverage, identity) for annotated accessions as TSV',
      position: 57,
    },
    FAAHypothetical: {
      label: 'faa (hypothetical)',
      description: 'hypothetical protein CDS amino acid sequences as FASTA',
      position: 60,
    },
    PNGCircularPlot: {
      label: 'circular plot (png)',
      description: 'circular genome annotation plot as PNG',
      position: 70,
    },
    SVGCircularPlot: {
      label: 'circular plot (svg)',
      description: 'circular genome annotation plot as SVG',
      position: 80,
    },
    TXTLogs: {
      label: 'bakta summary',
      description: 'summary as TXT',
      position: 90,
    },
  }
  const l: { key: string; label: string; description?: string; position: number; url: string }[] =
    []
  for (const { key, url } of listDownloadResultFiles(props.job.ResultFiles)) {
    l.push({ key, url, ...order[key] })
  }
  return l.sort((a, b) => a.position - b.position)
})
</script>
