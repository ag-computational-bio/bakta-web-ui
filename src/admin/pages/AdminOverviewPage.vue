<template>
  <AdminFilterBar />
  <Notification v-if="error" class="mb-3" type="danger" :message="error" />

  <!-- what an admin should look at, hidden when everything is fine -->
  <div v-if="attention.length" class="d-flex flex-wrap align-items-center gap-2 mb-3">
    <span class="section-label mb-0">Needs attention</span>
    <RouterLink v-for="item in attention" :key="item.text" :to="item.to" class="attention-item">
      <i class="bi" :class="item.icon" aria-hidden="true"></i>{{ item.text }}
    </RouterLink>
  </div>

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
      y-title="Jobs"
    />
    <p v-else class="text-secondary mb-0">No jobs in this time range.</p>
  </div>

  <div class="row g-4">
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">By workflow kind</h3>
        <div class="table-responsive scroll-hint">
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
        <div class="table-responsive scroll-hint">
          <table class="table table-striped align-middle text-nowrap mb-0">
            <thead>
              <tr>
                <th>Bakta</th>
                <th>Database</th>
                <th>Baktfold</th>
                <th class="text-end">Jobs</th>
                <th>First seen</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in versionPage" :key="i">
                <td>{{ row.bakta_version ?? '-' }}</td>
                <td>{{ row.bakta_db_version ?? '-' }}</td>
                <td>{{ row.baktfold_version ?? '-' }}</td>
                <td class="text-end">{{ formatCount(row.jobs_total) }}</td>
                <td>{{ formatDateTime(row.first_seen) }}</td>
                <td>{{ formatDateTime(row.last_seen) }}</td>
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
    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h3 class="section-title">By origin</h3>
        <div class="table-responsive scroll-hint">
          <table class="table table-striped align-middle text-nowrap mb-0">
            <thead>
              <tr>
                <th>Origin</th>
                <th class="text-end">Jobs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summary?.by_origin ?? []" :key="row.origin ?? ''">
                <td>{{ formatOrigin(row.origin) }}</td>
                <td class="text-end">{{ formatCount(row.jobs_total) }}</td>
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
import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { GroupBy, Interval, StatsSummary, Timeseries, VersionStats } from '../admin-api'
import {
  filterQuery,
  filters,
  firstBucket,
  intervalNote,
  loadChart,
  previousFilter,
  previousLabel,
  statsFilter,
} from '../admin-filters'
import { loadCachedFirst } from '../admin-cache'
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
  formatOrigin,
  formatPercent,
  successRate,
  formatPeriod,
  periodRange,
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
// the active jobs right now, with the creation time of the oldest
const active = ref<{ total: number; oldest?: string }>()
// the jobs that are failed now, with the filters of the request that counted them
const failedNow = ref<{ total: number; query: LocationQueryRaw; environment: string }>()
const failedQuery = () => ({ ...filterQuery(), status: 'failed,error' })
const orphans = ref(0)
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

// active jobs only need attention when one of them waits or runs this long
const longActiveSeconds = 2 * 3600

const attention = computed(() => {
  const items: { text: string; icon: string; to: RouteLocationRaw }[] = []
  const f = failedNow.value
  // a count of other filters (still loading or failed to reload) is not shown
  const current =
    f?.environment === filters.environment &&
    JSON.stringify(f.query) === JSON.stringify(failedQuery())
  if (f?.total && current) {
    items.push({
      text: `${formatCount(f.total)} failed ${f.total === 1 ? 'job' : 'jobs'} in this range`,
      icon: 'bi-x-circle text-danger',
      to: { path: '/admin/jobs', query: f.query },
    })
  }
  const a = active.value
  if (a?.oldest && (Date.now() - Date.parse(a.oldest)) / 1000 > longActiveSeconds) {
    const age = formatDuration((Date.now() - Date.parse(a.oldest)) / 1000)
    items.push({
      text: `${formatCount(a.total)} active ${a.total === 1 ? 'job' : 'jobs'}, the oldest was created ${age} ago`,
      icon: 'bi-hourglass-split text-warning-emphasis',
      to: {
        path: '/admin/jobs',
        query: { range: 'all', status: 'submitted,running', sort: '-created_at' },
      },
    })
  }
  if (orphans.value) {
    items.push({
      text: `${formatCount(orphans.value)} ${orphans.value === 1 ? 'workflow' : 'workflows'} without a job record`,
      icon: 'bi-question-circle text-secondary',
      to: { path: '/admin/jobs', query: filterQuery(), hash: '#orphans' },
    })
  }
  return items
})

const periods = computed(() =>
  overall.value ? chartPeriods(overall.value.buckets, statsFilter(), interval.value) : [],
)
// the tooltip names the days of a bar, the axis the start
const periodLabels = computed(() => periods.value.map((p) => periodRange(p, interval.value)))
const periodTicks = computed(() =>
  periods.value.map((p) => formatPeriod(p, interval.value).replace('Week of ', '')),
)
const jobValues = computed(() =>
  grouped.value ? bucketValues(grouped.value.buckets, periods.value, 'jobs_total') : {},
)
const jobSeries = computed(() => groupSeries(groupBy.value, Object.keys(jobValues.value)))
let request = 0
async function load() {
  const current = ++request
  const filter = statsFilter()
  const counted = { query: failedQuery(), environment: filters.environment }
  loading.value = true
  error.value = undefined
  const before = previousFilter(filter)
  const environment = filters.environment
  try {
    // a recent answer for the same filters shows at once
    await loadCachedFirst(
      api,
      (api) =>
        Promise.all([
          api.summary(filter),
          before ? api.summary(before) : undefined,
          api.jobs({
            environment,
            status: ['submitted', 'running'],
            sort: '-created_at',
            limit: 1,
          }),
          api.jobs({ ...filter, environment, status: ['failed', 'error'], limit: 1 }),
          loadChart(
            (i) =>
              Promise.all([
                api.timeseries(filter, i, groupBy.value),
                api.timeseries(filter, i, 'none'),
              ]),
            ([, o]) => firstBucket(o.buckets),
          ),
          api.versions(filter),
        ]),
      ([s, p, a, f, chart, v]) => {
        // an older answer must not replace the data of a newer request
        if (current !== request) return
        summary.value = s
        previous.value = p
        active.value = { total: a.total, oldest: a.items[0]?.created_at }
        failedNow.value = { total: f.total, ...counted }
        interval.value = chart.interval
        ;[grouped.value, overall.value] = chart.data
        versions.value = [...v.items].sort((a, b) =>
          (b.last_seen ?? '').localeCompare(a.last_seen ?? ''),
        )
      },
    )
  } catch (e) {
    if (current === request) error.value = handleAdminError(e)
  } finally {
    if (current === request) loading.value = false
  }
}

// the workflows without a job record load on their own, so the tiles do not wait for them
let orphanRequest = 0
async function loadOrphans() {
  const current = ++orphanRequest
  const environment = filters.environment
  try {
    await loadCachedFirst(
      api,
      (api) => api.workflows({ environment, orphans: true }),
      (list) => current === orphanRequest && (orphans.value = list.total),
    )
  } catch (e) {
    if (current === orphanRequest) error.value = handleAdminError(e)
  }
}

watch([filters, groupBy], load, { immediate: true })
watch(() => filters.environment, loadOrphans, { immediate: true })
</script>

<style scoped>
/* on small screens wide tables scroll sideways: room at the end and a fade as a hint */
@media (max-width: 575.98px) {
  .scroll-hint {
    mask-image: linear-gradient(to right, #000 calc(100% - 1.5rem), transparent);
  }
  .scroll-hint table td:last-child,
  .scroll-hint table th:last-child {
    padding-right: 1.5rem;
  }
}
.loading {
  opacity: 0.6;
}
.attention-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
  text-decoration: none;
  font-size: var(--bakta-font-size-md);
}
.attention-item:hover,
.attention-item:focus-visible {
  border-color: var(--bs-primary-border-subtle);
  background-color: var(--bs-primary-bg-subtle);
  color: var(--bs-primary-text-emphasis);
}
</style>
