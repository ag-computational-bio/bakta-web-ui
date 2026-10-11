<template>
  <div class="feature-filter mb-3" role="group" aria-label="Filter by feature type">
    <button
      v-for="t in featureTypes"
      :key="t.type"
      type="button"
      class="feature-chip"
      :class="{ active: type === t.type }"
      :aria-pressed="type === t.type"
      @click="type = t.type"
    >
      {{ t.label }}<span class="count">{{ t.count }}</span>
    </button>
  </div>
  <div class="annotation-table">
    <DataTable
      ref="dataTable"
      class="table table-striped"
      :columns="columns"
      :data="table"
      :options="dataTableConfig"
      tableId="bakta-annotation"
    />
  </div>
</template>

<script setup lang="ts">
import bakta from '@/bakta-helper'
import type { Result } from '@/model/result-data'
import DataTablesCore from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.css'
import DataTable from 'datatables.net-vue3'

import { computed, nextTick, ref, unref, watch } from 'vue'
DataTable.use(DataTablesCore)
const props = defineProps<{
  data: Result
}>()
const type = defineModel<string>('type', { default: '' })
const dataTable = ref<InstanceType<typeof DataTable>>()

// another feature type starts on the first page, the old page may not exist anymore
watch(type, async () => {
  await nextTick()
  unref(dataTable.value?.dt)?.page(0).draw(false)
})

const dataTableConfig = {
  scrollY: '70vh',
  scrollCollapse: true,
  paging: true,
  pageLength: 100,
  processing: true,
  deferRender: true,
  lengthMenu: [50, 100, 250],
  orderClasses: false,
}

const columns = [
  {
    data: 'contig',
    title: 'Sequence',
    render: DataTablesCore.render.text(),
  },
  { data: 'type', title: 'Type', render: DataTablesCore.render.text() },
  { data: 'start', title: 'Start', render: DataTablesCore.render.text() },
  { data: 'stop', title: 'Stop', render: DataTablesCore.render.text() },
  {
    data: 'strand',
    title: 'Strand',
    render: DataTablesCore.render.text(),
  },
  {
    data: 'locus',
    title: 'Locus tag',
    render: DataTablesCore.render.text(),
  },
  {
    data: 'gene',
    title: 'Gene',
    render: DataTablesCore.render.text(),
  },
  {
    data: 'product',
    title: 'Product',
    render: DataTablesCore.render.text(),
  },
  { data: 'dbxrefs', title: 'DbXrefs' },
]

const featureTypes = computed(() => [
  { type: '', count: props.data.features.length, label: 'All' },
  ...Object.entries(bakta.featureCount(props.data))
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ type, count, label: bakta.featureTypeLabel(type) }))
    .sort((a, b) => b.count - a.count),
])

const table = computed(() => {
  const features = type.value
    ? props.data.features.filter((x) => x.type === type.value)
    : props.data.features
  return features.map((x) => ({
    contig: x.sequence || '',
    type: x.type || '',
    start: x.start || '',
    stop: x.stop || '',
    strand: x.strand || '',
    locus: x.locus || '',
    product: x.product || '',
    gene: x.gene || '',
    dbxrefs: x.db_xrefs
      ? x.db_xrefs
          // url is hard coded for the moment. Should be moved to rest-api module
          .map(
            (x) =>
              '<a class="dbxref" target="_blank" rel="noopener" href="https://psos-staging.computational.bio/api/v1/dbxref/redirect/' +
              x +
              '">' +
              x +
              '</a>',
          )
          .join(' ')
      : '',
  }))
})
</script>
<style>
/* the table controls (page size, search, paging) use the same size as the table text */
.annotation-table .dt-container {
  font-size: var(--bakta-font-size-md);
}
/* plain row colors instead of the per cell shadow, which shows thin lines between cells */
.annotation-table table.table.dataTable.table-striped > tbody > tr > * {
  box-shadow: none;
}
.annotation-table table.table.dataTable.table-striped > tbody > tr:nth-of-type(odd) > * {
  background-color: var(--bakta-surface);
}
.annotation-table .table td {
  font-variant-numeric: tabular-nums;
}
.dbxref {
  display: inline-block;
  margin: 0 0.25rem 0.25rem 0;
  padding: 0.125rem 0.5rem;
  border-radius: var(--bs-border-radius-sm);
  background-color: var(--bs-primary-bg-subtle);
  font-size: var(--bakta-font-size-sm);
  text-decoration: none;
}
.dbxref:hover {
  background-color: var(--bs-primary-border-subtle);
}
</style>
