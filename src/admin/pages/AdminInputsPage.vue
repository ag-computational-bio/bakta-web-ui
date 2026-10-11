<template>
  <AdminFilterBar>
    <ChipGroup v-model="kind" :options="kindFilterOptions" label="Workflow" />
  </AdminFilterBar>
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />

  <div class="row g-3 mb-4" :class="{ loading }">
    <div v-for="tile in tiles" :key="tile.label" class="col-6 col-lg-3">
      <StatTile v-bind="tile" />
    </div>
  </div>

  <div class="row g-4 mb-4">
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">Input size distribution</h3>
        <SeriesChart
          v-if="stats?.jobs"
          kind="bars"
          label="Input size distribution"
          :labels="sizeLabels.map((l) => l.label)"
          :tick-labels="sizeLabels.map((l) => l.tick)"
          :series="sizeSeries"
          :values="{ jobs: stats.size_histogram.map((b) => b.jobs) }"
          :format="formatCount"
        />
        <p v-else class="text-secondary mb-0">No inputs in this time range.</p>
      </div>
    </div>
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">Sequences per input</h3>
        <SeriesChart
          v-if="stats?.jobs"
          kind="bars"
          label="Sequences per input"
          :labels="sequenceLabels.map((l) => l.label)"
          :tick-labels="sequenceLabels.map((l) => l.tick)"
          :series="sequenceSeries"
          :values="sequenceValues"
          :format="formatCount"
        />
        <p v-else class="text-secondary mb-0">No inputs in this time range.</p>
      </div>
    </div>
  </div>

  <div class="card p-4 mb-4">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h3 class="section-title mb-0">Input size over time</h3>
      <ChipGroup v-model="interval" :options="intervalOptions" label="Interval" />
    </div>
    <SeriesChart
      v-if="periods.length"
      kind="lines"
      label="Input size over time"
      :labels="periodLabels"
      :tick-labels="periodLabels.map((l) => l.replace('Week of ', ''))"
      :series="timeSeries"
      :values="timeValues"
      :format="(mbp) => formatBp(mbp == null ? null : mbp * 1e6)"
      :axis-format="(mbp) => `${mbp} Mbp`"
    />
    <p v-else class="text-secondary mb-0">No jobs in this time range.</p>
  </div>

  <div class="card p-4 mb-4">
    <h3 class="section-title">By workflow kind</h3>
    <div class="table-responsive">
      <table class="table table-striped align-middle text-nowrap mb-0">
        <thead>
          <tr>
            <th>Workflow</th>
            <th class="text-end">Inputs</th>
            <th class="text-end">Total input</th>
            <th class="text-end">Median size</th>
            <th class="text-end">Average size</th>
            <th class="text-end">Median sequences</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in stats?.by_workflow_kind ?? []" :key="row.workflow_kind">
            <td>{{ kindLabel(row.workflow_kind) }}</td>
            <td class="text-end">{{ formatCount(row.jobs) }}</td>
            <td class="text-end">{{ formatBp(row.total_bp) }}</td>
            <td class="text-end">{{ formatBp(row.p50_bp) }}</td>
            <td class="text-end">{{ formatBp(row.avg_bp) }}</td>
            <td class="text-end">{{ formatCount(row.p50_sequences) }}</td>
          </tr>
          <tr v-if="!stats?.by_workflow_kind.length">
            <td colspan="6" class="text-center text-secondary py-4">
              No inputs in this time range.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card p-4">
    <h3 class="section-title">Largest inputs</h3>
    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0 jobs">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Organism</th>
            <th class="text-end">Input</th>
            <th>Workflow</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in stats?.largest ?? []" :key="job.id" @click="open(job.id)">
            <td>
              <RouterLink :to="detailLink(job.id)" :title="job.id" @click.stop>
                {{ job.id.slice(0, 8) }}
              </RouterLink>
            </td>
            <td>{{ job.organism ?? '-' }}</td>
            <td class="text-end text-nowrap">
              {{ formatBp(job.total_length) }}
              <div v-if="job.sequence_count != undefined" class="small text-secondary">
                {{ formatCount(job.sequence_count) }}
                {{ job.sequence_count === 1 ? 'sequence' : 'sequences' }}
              </div>
            </td>
            <td>
              <Shield
                v-if="isWorkflowKind(job.workflow_kind)"
                v-bind="workflowShieldProps(job.workflow_kind)"
              >
                {{ formatWorkflowKind(job.workflow_kind) }}
              </Shield>
              <span v-else>{{ job.workflow_kind }}</span>
            </td>
            <td><StatusBadge :status="job.status" /></td>
            <td class="text-nowrap">{{ formatDateTime(job.created_at) }}</td>
          </tr>
          <tr v-if="!stats?.largest.length">
            <td colspan="6" class="text-center text-secondary py-4">
              No inputs in this time range.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import Shield from '@/components/Shield.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatWorkflowKind, workflowShieldProps } from '@/model/job'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { InputStats, Interval, Timeseries } from '../admin-api'
import {
  defaultInterval,
  filters,
  intervalOptions,
  kindFilterOptions,
  statsFilter,
} from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { lightColor } from '../chart-colors'
import { bucketValues, chartPeriods } from '../chart-data'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import ChipGroup from '../components/ChipGroup.vue'
import SeriesChart from '../components/SeriesChart.vue'
import StatTile from '../components/StatTile.vue'
import {
  bpRange,
  formatBp,
  formatCount,
  formatDateTime,
  formatPeriod,
  isWorkflowKind,
  kindLabel,
  sequenceRange,
} from '../format'

const sizeSeries = [{ key: 'jobs', label: 'Inputs', ...lightColor('primary') }]
// a single sequence is typical for complete genomes, many sequences for draft assemblies
const sequenceSeries = [
  { key: 'single', label: 'One sequence, like complete genomes', ...lightColor('success') },
  { key: 'several', label: 'Several sequences, like draft assemblies', ...lightColor('primary') },
]
const timeSeries = [
  { key: 'p50', label: 'Median', color: 'var(--bs-primary)' },
  { key: 'avg', label: 'Average', color: 'var(--bs-info)' },
]

const api = useAdminApi()
const router = useRouter()
const kind = ref('')
const interval = ref<Interval>(defaultInterval(filters.range))
const stats = ref<InputStats>()
const series = ref<Timeseries>()
const error = ref<string>()
const loading = ref(false)

watch(
  () => filters.range,
  (range) => (interval.value = defaultInterval(range)),
)

function round(n: number | null | undefined): number | null {
  return n == null ? null : Math.round(n)
}

function detailLink(id: string) {
  return { name: 'AdminJob', params: { id } }
}

function open(id: string) {
  router.push(detailLink(id))
}

const tiles = computed(() => {
  const s = stats.value
  return [
    { label: 'Inputs', value: formatCount(s?.jobs), hint: 'jobs with a known size' },
    { label: 'Total input', value: formatBp(s?.total_bp) },
    { label: 'Median size', value: formatBp(s?.total_length.p50) },
    { label: 'p90 size', value: formatBp(s?.total_length.p90) },
    { label: 'Average size', value: formatBp(s?.total_length.avg) },
    { label: 'Largest input', value: formatBp(s?.total_length.max) },
    { label: 'Median sequences', value: formatCount(round(s?.sequence_count.p50)) },
    { label: 'p90 sequences', value: formatCount(round(s?.sequence_count.p90)) },
  ]
})

const sizeLabels = computed(() =>
  (stats.value?.size_histogram ?? []).map((b) => bpRange(b.min_bp, b.max_bp)),
)
const sequenceLabels = computed(() =>
  (stats.value?.sequence_histogram ?? []).map((b) =>
    sequenceRange(b.min_sequences, b.max_sequences),
  ),
)
const sequenceValues = computed(() => {
  const list = stats.value?.sequence_histogram ?? []
  const single = (b: (typeof list)[number]) => b.max_sequences === 1
  return {
    single: list.map((b) => (single(b) ? b.jobs : 0)),
    several: list.map((b) => (single(b) ? 0 : b.jobs)),
  }
})

const periods = computed(() =>
  series.value ? chartPeriods(series.value.buckets, statsFilter(), interval.value) : [],
)
const periodLabels = computed(() => periods.value.map((p) => formatPeriod(p, interval.value)))
const timeValues = computed(() => {
  const buckets = series.value?.buckets ?? []
  // in Mbp, so the axis gets round steps
  const field = (name: 'input_p50_bp' | 'input_avg_bp') =>
    (bucketValues(buckets, periods.value, name)[kind.value] ?? []).map((v) =>
      v == null ? null : v / 1e6,
    )
  return { p50: field('input_p50_bp'), avg: field('input_avg_bp') }
})

let request = 0
async function load() {
  const current = ++request
  const filter = statsFilter()
  loading.value = true
  error.value = undefined
  try {
    const [i, t] = await Promise.all([
      api.inputs(filter, kind.value || undefined),
      // with a workflow kind the series is grouped by kind, without one there is one group
      api.timeseries(filter, interval.value, kind.value ? 'workflow_kind' : 'none'),
    ])
    // an older answer must not replace the data of a newer request
    if (current !== request) return
    stats.value = i
    series.value = t
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

watch([filters, kind, interval], load, { immediate: true })
</script>

<style scoped>
.loading {
  opacity: 0.6;
}
.jobs tbody tr {
  cursor: pointer;
}
</style>
