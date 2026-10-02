<template>
  <DataTable
    class="table table-hover"
    :columns="columns"
    :data="table"
    :options="dataTableConfig"
    tableId="bakta-annotation"
  />
</template>

<script setup lang="ts">
import type { Result } from '@/model/result-data'
import DataTablesCore from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.css'
import DataTable from 'datatables.net-vue3'

import { computed } from 'vue'
DataTable.use(DataTablesCore)
const props = defineProps<{
  data: Result
}>()

const dataTableConfig = {
  scrollY: '70vh',
  scrollCollapse: true,
  paging: true,
  pageLength: 100,
  processing: true,
  deferRender: true,
  lengthMenu: [50, 100, 250],
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

const table = computed(() => {
  return props.data.features.map((x) => ({
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
.dbxref {
  display: inline-block;
  margin: 0 0.25rem 0.25rem 0;
  padding: 0 0.4rem;
  border-radius: var(--bs-border-radius-sm);
  background-color: var(--bakta-surface);
  font-size: 0.8rem;
  text-decoration: none;
}
.dbxref:hover {
  background-color: var(--bs-primary-bg-subtle);
}
</style>
