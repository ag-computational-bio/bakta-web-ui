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
      <div class="d-flex align-items-baseline gap-2">
        <h3 class="section-title mb-0">Jobs over time</h3>
        <span class="small text-secondary">{{ intervalNote(interval) }}</span>
      </div>
      <ChipGroup v-model="groupBy" :options="groupOptions" label="Group by" segmented />
    </div>
    <SeriesChart
      v-if="periods.length"
      kind="bars"
      label="Jobs over time"
      :labels="periodLabels"
      :tick-labels="periodTicks"
      :series="jobSeries"
      :values="jobValues"
      :format="formatCount"
    />
    <p v-else class="text-secondary mb-0">No jobs in this time range.</p>
  </div>

  <div class="row g-4">
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">By workflow kind</h3>
        <div class="table-responsive">
          <table class="table table-striped align-middle text-nowrap mb-0">
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
                  {{ formatPercent(successRate(row)) }}
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
          <table class="table table-striped align-middle text-nowrap mb-0">
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
              <tr v-for="(row, i) in versionPage" :key="i">
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
        <ListPagination
          v-model:page="versionPageNumber"
          v-model:page-size="versionPageSize"
          :total="versions.length"
          label="versions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { formatWorkflowKind, type WorkflowKind } from '@/model/job'
import { computed, ref, watch } from 'vue'
import type { GroupBy, Interval, StatsSummary, Timeseries, VersionStats } from '../admin-api'
import {
  filters,
  firstBucket,
  intervalNote,
  loadChart,
  previousFilter,
  previousLabel,
  statsFilter,
} from '../admin-filters'
import { handleAdminError, useAdminApi } from '../admin-session'
import { groupSeries } from '../chart-colors'
import { bucketValues, chartPeriods } from '../chart-data'
import AdminFilterBar from '../components/AdminFilterBar.vue'
import ChipGroup from '../components/ChipGroup.vue'
import ListPagination from '../components/ListPagination.vue'
import StatTile from '../components/StatTile.vue'
import SeriesChart from '../components/SeriesChart.vue'
import {
  changeText,
  formatBp,
  formatCount,
  formatDateTime,
  formatDuration,
  formatPercent,
  successRate,
  formatPeriod,
} from '../format'
import { useClientPages } from '../pagination'

const groupOptions: { value: GroupBy; label: string }[] = [
  { value: 'workflow_kind', label: 'Workflow' },
  { value: 'status', label: 'Status' },
]

const api = useAdminApi()
const interval = ref<Interval>('day')
const groupBy = ref<GroupBy>('workflow_kind')
const summary = ref<StatsSummary>()
// the summary of the period before, for the change of the tiles
const previous = ref<StatsSummary>()
const grouped = ref<Timeseries>()
const overall = ref<Timeseries>()
const versions = ref<VersionStats['items']>([])
const error = ref<string>()
const {
  page: versionPageNumber,
  pageSize: versionPageSize,
  pageItems: versionPage,
} = useClientPages(versions, 10)
const loading = ref(false)

const tiles = computed(() => {
  const s = summary.value
  const p = previous.value
  const period = previousLabel(filters.range)
  const failed = (x?: StatsSummary) => x && x.jobs_failed + x.jobs_error
  return [
    {
      label: 'Jobs',
      value: formatCount(s?.jobs_total),
      hint: s?.total_input_bp ? `${formatBp(s.total_input_bp)} input` : undefined,
      change: changeText(s?.jobs_total, p?.jobs_total, period),
    },
    {
      label: 'Success rate',
      value: formatPercent(s?.success_rate),
      hint: s && `of ${formatCount(s.jobs_finished)} finished jobs`,
      change: changeText(s?.success_rate, p?.success_rate, period, true),
    },
    {
      label: 'Failed',
      value: formatCount(failed(s)),
      hint: s?.jobs_error ? `${formatCount(s.jobs_error)} of them with errors` : undefined,
      change: changeText(failed(s), failed(p), period),
    },
    {
      label: 'Median runtime',
      value: formatDuration(s?.runtime_seconds.p50),
      hint:
        s?.queue_seconds.p50 != null
          ? `queue time ${formatDuration(s.queue_seconds.p50)}`
          : undefined,
      change: changeText(s?.runtime_seconds.p50, p?.runtime_seconds.p50, period),
    },
  ]
})

const periods = computed(() =>
  overall.value ? chartPeriods(overall.value.buckets, statsFilter(), interval.value) : [],
)
const periodLabels = computed(() => periods.value.map((p) => formatPeriod(p, interval.value)))
const periodTicks = computed(() => periodLabels.value.map((l) => l.replace('Week of ', '')))
const jobValues = computed(() =>
  grouped.value ? bucketValues(grouped.value.buckets, periods.value, 'jobs_total') : {},
)
const jobSeries = computed(() => groupSeries(groupBy.value, Object.keys(jobValues.value)))
let request = 0
async function load() {
  const current = ++request
  const filter = statsFilter()
  loading.value = true
  error.value = undefined
  try {
    const before = previousFilter(filter)
    const [s, p, chart, v] = await Promise.all([
      api.summary(filter),
      before ? api.summary(before) : undefined,
      loadChart(
        (i) =>
          Promise.all([
            api.timeseries(filter, i, groupBy.value),
            api.timeseries(filter, i, 'none'),
          ]),
        ([, o]) => firstBucket(o.buckets),
      ),
      api.versions(filter),
    ])
    // an older answer must not replace the data of a newer request
    if (current !== request) return
    summary.value = s
    previous.value = p
    interval.value = chart.interval
    ;[grouped.value, overall.value] = chart.data
    versions.value = [...v.items].sort((a, b) =>
      (b.last_seen ?? '').localeCompare(a.last_seen ?? ''),
    )
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

watch([filters, groupBy], load, { immediate: true })
</script>

<style scoped>
.loading {
  opacity: 0.6;
}
</style>
