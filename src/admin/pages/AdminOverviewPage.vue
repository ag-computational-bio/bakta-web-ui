<template>
  <AdminFilterBar />
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />

  <div class="row g-3 mb-4" :class="{ loading }">
    <div v-for="tile in tiles" :key="tile.label" class="col-6 col-lg-3">
      <StatTile v-bind="tile" />
    </div>
  </div>

  <div class="card p-4 mb-4">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h3 class="section-title mb-0">Jobs over time</h3>
      <div class="d-flex flex-wrap gap-3">
        <ChipGroup v-model="groupBy" :options="groupOptions" label="Group by" />
        <ChipGroup v-model="interval" :options="intervalOptions" label="Interval" />
      </div>
    </div>
    <TimeChart
      v-if="periods.length"
      kind="bars"
      label="Jobs over time"
      :periods="periods"
      :interval="interval"
      :series="jobSeries"
      :values="jobValues"
      :format="formatCount"
    />
    <p v-else class="text-secondary mb-0">No jobs in this time range.</p>
  </div>

  <div class="card p-4 mb-4">
    <h3 class="section-title">Runtime over time</h3>
    <TimeChart
      v-if="periods.length"
      kind="lines"
      label="Runtime over time"
      :periods="periods"
      :interval="interval"
      :series="runtimeSeries"
      :values="runtimeValues"
      :format="(minutes) => formatDuration(minutes == null ? null : minutes * 60)"
      :axis-format="(minutes) => `${minutes} min`"
    />
    <p v-else class="text-secondary mb-0">No jobs in this time range.</p>
  </div>

  <div class="row g-4">
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">By workflow kind</h3>
        <div class="table-responsive">
          <table class="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>Workflow</th>
                <th class="text-end">Jobs</th>
                <th class="text-end">Success rate</th>
                <th class="text-end">Median runtime</th>
                <th class="text-end">p90 runtime</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summary?.by_workflow_kind ?? []" :key="row.workflow_kind">
                <td>{{ formatWorkflowKind(row.workflow_kind as WorkflowKind) }}</td>
                <td class="text-end">{{ formatCount(row.jobs_total) }}</td>
                <td class="text-end">
                  {{ formatPercent(row.jobs_total ? row.jobs_succeeded / row.jobs_total : null) }}
                </td>
                <td class="text-end">{{ formatDuration(row.runtime_seconds.p50) }}</td>
                <td class="text-end">{{ formatDuration(row.runtime_seconds.p90) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">Versions</h3>
        <div class="table-responsive">
          <table class="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>Bakta</th>
                <th>Database</th>
                <th>Baktfold</th>
                <th class="text-end">Jobs</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in versions" :key="i">
                <td>{{ row.bakta_version ?? '-' }}</td>
                <td>{{ row.bakta_db_version ?? '-' }}</td>
                <td>{{ row.baktfold_version ?? '-' }}</td>
                <td class="text-end">{{ formatCount(row.jobs_total) }}</td>
                <td :title="`First seen ${formatDateTime(row.first_seen)}`">
                  {{ formatDateTime(row.last_seen) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { formatWorkflowKind, type WorkflowKind } from '@/model/job'
import { computed, ref, watch } from 'vue'
import type { GroupBy, Interval, StatsSummary, Timeseries, VersionStats } from '../admin-api'
import { filters, statsFilter } from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { groupSeries } from '../chart-colors'
import { bucketValues, chartPeriods } from '../chart-data'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import ChipGroup from '../components/ChipGroup.vue'
import StatTile from '../components/StatTile.vue'
import TimeChart from '../components/TimeChart.vue'
import { formatBp, formatCount, formatDateTime, formatDuration, formatPercent } from '../format'

const intervalOptions: { value: Interval; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]
const groupOptions: { value: GroupBy; label: string }[] = [
  { value: 'workflow_kind', label: 'Workflow' },
  { value: 'status', label: 'Status' },
]

const api = useAdminApi()
const interval = ref<Interval>(defaultInterval(filters.range))
const groupBy = ref<GroupBy>('workflow_kind')
const summary = ref<StatsSummary>()
const grouped = ref<Timeseries>()
const overall = ref<Timeseries>()
const versions = ref<VersionStats['items']>([])
const error = ref<string>()
const loading = ref(false)

// a matching interval for the time range, so the chart has a useful number of bars
function defaultInterval(range: string): Interval {
  return range === '30d' ? 'day' : range === '12m' ? 'week' : 'month'
}
watch(
  () => filters.range,
  (range) => (interval.value = defaultInterval(range)),
)

const tiles = computed(() => {
  const s = summary.value
  return [
    { label: 'Jobs', value: formatCount(s?.jobs_total) },
    {
      label: 'Success rate',
      value: formatPercent(s?.success_rate),
      hint: s && `of ${formatCount(s.jobs_finished)} finished jobs`,
    },
    {
      label: 'Failed',
      value: formatCount(s && s.jobs_failed + s.jobs_error),
      hint: s && `${formatCount(s.jobs_error)} of them with errors`,
    },
    { label: 'Active', value: formatCount(s?.jobs_active), hint: 'waiting or running' },
    { label: 'Median runtime', value: formatDuration(s?.runtime_seconds.p50) },
    { label: 'p90 runtime', value: formatDuration(s?.runtime_seconds.p90) },
    {
      label: 'Queue time',
      value: formatDuration(s?.queue_seconds.p50),
      hint: s && `median, p90 ${formatDuration(s.queue_seconds.p90)}`,
    },
    { label: 'Total input', value: formatBp(s?.total_input_bp) },
  ]
})

const periods = computed(() =>
  overall.value ? chartPeriods(overall.value.buckets, statsFilter(), interval.value) : [],
)
const jobValues = computed(() =>
  grouped.value ? bucketValues(grouped.value.buckets, periods.value, 'jobs_total') : {},
)
const jobSeries = computed(() => groupSeries(groupBy.value, Object.keys(jobValues.value)))
const runtimeSeries = [
  { key: 'p50', label: 'Median', color: 'var(--bs-primary)' },
  { key: 'avg', label: 'Average', color: 'var(--bs-info)' },
]
const runtimeValues = computed(() => {
  const buckets = overall.value?.buckets ?? []
  // in minutes, so the axis gets round steps
  const minutes = (values: (number | null)[] = []) => values.map((v) => (v == null ? v : v / 60))
  return {
    p50: minutes(bucketValues(buckets, periods.value, 'runtime_p50')['']),
    avg: minutes(bucketValues(buckets, periods.value, 'runtime_avg')['']),
  }
})

let request = 0
async function load() {
  const current = ++request
  const filter = statsFilter()
  loading.value = true
  error.value = undefined
  try {
    const [s, g, o, v] = await Promise.all([
      api.summary(filter),
      api.timeseries(filter, interval.value, groupBy.value),
      api.timeseries(filter, interval.value, 'none'),
      api.versions(filter),
    ])
    // an older answer must not replace the data of a newer request
    if (current !== request) return
    summary.value = s
    grouped.value = g
    overall.value = o
    versions.value = [...v.items].sort((a, b) =>
      (b.last_seen ?? '').localeCompare(a.last_seen ?? ''),
    )
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

watch([filters, interval, groupBy], load, { immediate: true })
</script>

<style scoped>
.loading {
  opacity: 0.6;
}
</style>
