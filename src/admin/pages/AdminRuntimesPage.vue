<template>
  <AdminFilterBar>
    <select v-model="kind" class="form-select form-select-sm w-auto" aria-label="Workflow">
      <option v-for="option in kindFilterOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
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
        <h3 class="section-title">Runtime distribution</h3>
        <SeriesChart
          v-if="stats?.jobs"
          kind="bars"
          label="Runtime distribution"
          :labels="histogramLabels.map((l) => l.label)"
          :tick-labels="histogramLabels.map((l) => l.tick)"
          :series="histogramSeries"
          :values="{ jobs: stats.histogram.map((b) => b.jobs) }"
          :format="formatCount"
        />
        <p v-else class="text-secondary mb-0">No succeeded jobs in this time range.</p>
      </div>
    </div>
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">Runtime by input size</h3>
        <SeriesChart
          v-if="stats?.jobs"
          kind="dots"
          label="Runtime by input size"
          :labels="sizeLabels.map((l) => l.label)"
          :tick-labels="sizeLabels.map((l) => l.tick)"
          :notes="stats.by_input_size.map((b) => `${formatCount(b.jobs)} jobs`)"
          :series="sizeSeries"
          :values="sizeValues"
          :format="formatMinutes"
          :axis-format="(minutes) => `${minutes} min`"
        />
        <p v-else class="text-secondary mb-0">No succeeded jobs in this time range.</p>
      </div>
    </div>
  </div>

  <div class="card p-4 mb-4">
    <div class="d-flex align-items-baseline gap-2 mb-3">
      <h3 class="section-title mb-0">Runtime over time</h3>
      <span class="small text-secondary">{{ intervalNote(interval) }}</span>
    </div>
    <SeriesChart
      v-if="periods.length"
      kind="lines"
      label="Runtime over time"
      :labels="periodLabels"
      :tick-labels="periodLabels.map((l) => l.replace('Week of ', ''))"
      :series="timeSeries"
      :values="timeValues"
      :format="formatMinutes"
      :axis-format="(minutes) => `${minutes} min`"
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
            <th class="text-end">Jobs</th>
            <th v-for="column in kindColumns" :key="column.key" class="text-end">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in stats?.by_workflow_kind ?? []" :key="row.workflow_kind">
            <td>{{ kindLabel(row.workflow_kind) }}</td>
            <td class="text-end">{{ formatCount(row.jobs) }}</td>
            <td v-for="column in kindColumns" :key="column.key" class="text-end">
              {{ formatDuration(row[column.key]) }}
            </td>
          </tr>
          <tr v-if="!stats?.by_workflow_kind.length">
            <td :colspan="kindColumns.length + 2" class="text-center text-secondary py-4">
              No succeeded jobs in this time range.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card p-4">
    <h3 class="section-title">Slowest jobs</h3>
    <div class="table-responsive">
      <table class="table table-striped align-middle mb-0 jobs">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Organism</th>
            <th class="text-end">Input</th>
            <th>Workflow</th>
            <th>Created</th>
            <th class="text-end">Runtime</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in stats?.slowest ?? []" :key="job.id" @click="open(job.id)">
            <td>
              <RouterLink :to="detailLink(job.id)" :title="job.id" @click.stop>
                {{ job.id.slice(0, 8) }}
              </RouterLink>
            </td>
            <td>{{ job.organism ?? '-' }}</td>
            <td class="text-end text-nowrap">{{ formatBp(job.total_length) }}</td>
            <td>
              <Shield
                v-if="isWorkflowKind(job.workflow_kind)"
                v-bind="workflowShieldProps(job.workflow_kind)"
              >
                {{ formatWorkflowKind(job.workflow_kind) }}
              </Shield>
              <span v-else>{{ job.workflow_kind }}</span>
            </td>
            <td class="text-nowrap">{{ formatDateTime(job.created_at) }}</td>
            <td class="text-end text-nowrap">{{ formatDuration(job.runtime_seconds) }}</td>
          </tr>
          <tr v-if="!stats?.slowest.length">
            <td colspan="6" class="text-center text-secondary py-4">
              No succeeded jobs in this time range.
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
import { formatWorkflowKind, workflowShieldProps } from '@/model/job'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Interval, RuntimeStats, StatsSummary, Timeseries } from '../admin-api'
import {
  filters,
  firstBucket,
  intervalNote,
  kindFilterOptions,
  loadChart,
  statsFilter,
} from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { lightColor } from '../chart-colors'
import { bucketValues, chartPeriods } from '../chart-data'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import SeriesChart from '../components/SeriesChart.vue'
import StatTile from '../components/StatTile.vue'
import {
  bpRange,
  formatBp,
  formatCount,
  formatDateTime,
  formatDuration,
  formatPeriod,
  isWorkflowKind,
  kindLabel,
  secondsRange,
} from '../format'

type KindRow = RuntimeStats['by_workflow_kind'][number]

const kindColumns: { key: Exclude<keyof KindRow, 'workflow_kind' | 'jobs'>; label: string }[] = [
  { key: 'min', label: 'Min' },
  { key: 'p25', label: 'p25' },
  { key: 'p50', label: 'Median' },
  { key: 'p75', label: 'p75' },
  { key: 'p90', label: 'p90' },
  { key: 'p95', label: 'p95' },
  { key: 'p99', label: 'p99' },
  { key: 'max', label: 'Max' },
  { key: 'avg', label: 'Average' },
  { key: 'stddev', label: 'Std. dev.' },
]
const histogramSeries = [{ key: 'jobs', label: 'Jobs', ...lightColor('primary') }]
const sizeSeries = [
  { key: 'p50', label: 'Median', color: 'var(--bs-primary)' },
  { key: 'p90', label: 'p90', color: 'var(--bs-warning-text-emphasis)' },
]
const timeSeries = [
  { key: 'p50', label: 'Median', color: 'var(--bs-primary)' },
  { key: 'p90', label: 'p90', color: 'var(--bs-warning-text-emphasis)' },
  { key: 'avg', label: 'Average', color: 'var(--bs-info)' },
]

const api = useAdminApi()
const router = useRouter()
const kind = ref('')
const interval = ref<Interval>('day')
const stats = ref<RuntimeStats>()
const summary = ref<StatsSummary>()
const series = ref<Timeseries>()
const error = ref<string>()
const loading = ref(false)

function formatMinutes(minutes: number | null): string {
  return formatDuration(minutes == null ? null : minutes * 60)
}

// in minutes, so the axis gets round steps
function minutes(values: (number | null | undefined)[] = []): (number | null)[] {
  return values.map((v) => (v == null ? null : v / 60))
}

function detailLink(id: string) {
  return { name: 'AdminJob', params: { id } }
}

function open(id: string) {
  router.push(detailLink(id))
}

const tiles = computed(() => {
  const s = stats.value
  // the runtime endpoint has percentiles per workflow kind only, so all kinds use the summary
  const one = s?.by_workflow_kind.length === 1 ? s.by_workflow_kind[0] : undefined
  const overall = one ?? summary.value?.runtime_seconds
  return [
    { label: 'Jobs with runtime', value: formatCount(s?.jobs), hint: 'succeeded jobs' },
    { label: 'Median runtime', value: formatDuration(overall?.p50) },
    { label: 'p90 runtime', value: formatDuration(overall?.p90) },
    { label: 'p99 runtime', value: formatDuration(overall?.p99) },
    { label: 'Average runtime', value: formatDuration(overall?.avg) },
    { label: 'Longest runtime', value: formatDuration(s?.slowest[0]?.runtime_seconds) },
    {
      label: 'Runtime per Mbp',
      value: formatDuration(s?.seconds_per_mbp.p50),
      hint: s && `median, average ${formatDuration(s.seconds_per_mbp.avg)}`,
    },
    {
      label: 'Queue time',
      value: formatDuration(s?.queue_seconds.p50),
      hint: s && `median, p90 ${formatDuration(s.queue_seconds.p90)}`,
    },
  ]
})

const histogramLabels = computed(() =>
  (stats.value?.histogram ?? []).map((b) => secondsRange(b.min_seconds, b.max_seconds)),
)
const sizeLabels = computed(() =>
  (stats.value?.by_input_size ?? []).map((b) => bpRange(b.min_bp, b.max_bp)),
)
const sizeValues = computed(() => {
  const list = stats.value?.by_input_size ?? []
  return {
    p50: minutes(list.map((b) => b.runtime_p50)),
    p90: minutes(list.map((b) => b.runtime_p90)),
  }
})

const periods = computed(() =>
  series.value ? chartPeriods(series.value.buckets, statsFilter(), interval.value) : [],
)
const periodLabels = computed(() => periods.value.map((p) => formatPeriod(p, interval.value)))
const timeValues = computed(() => {
  const buckets = series.value?.buckets ?? []
  // with a workflow kind the series is grouped by kind, without one there is one group
  const field = (name: 'runtime_p50' | 'runtime_p90' | 'runtime_avg') =>
    minutes(bucketValues(buckets, periods.value, name)[kind.value])
  return { p50: field('runtime_p50'), p90: field('runtime_p90'), avg: field('runtime_avg') }
})

let request = 0
async function load() {
  const current = ++request
  const filter = statsFilter()
  loading.value = true
  error.value = undefined
  try {
    const [r, s, t] = await Promise.all([
      api.runtimes(filter, kind.value || undefined),
      api.summary(filter),
      loadChart(
        (i) => api.timeseries(filter, i, kind.value ? 'workflow_kind' : 'none'),
        (t) => firstBucket(t.buckets),
      ),
    ])
    // an older answer must not replace the data of a newer request
    if (current !== request) return
    stats.value = r
    summary.value = s
    interval.value = t.interval
    series.value = t.data
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

watch([filters, kind], load, { immediate: true })
</script>

<style scoped>
.loading {
  opacity: 0.6;
}
.jobs tbody tr {
  cursor: pointer;
}
</style>
