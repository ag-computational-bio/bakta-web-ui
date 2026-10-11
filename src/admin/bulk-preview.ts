import { computed, ref, shallowRef, watch } from 'vue'
import type {
  AdminApi,
  AdminJobStatus,
  BulkAction,
  BulkItem,
  BulkRequest,
  Environment,
  WorkflowPhase,
} from './admin-api'

/*
 * A bulk action on the live workflows that match the filters of the job list.
 * The real run only processes the workflows of the preview that is shown, with
 * the action and the filters of that preview.
 */

// job statuses with a workflow phase of the same meaning
const statusPhases: Partial<Record<AdminJobStatus, WorkflowPhase>> = {
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  error: 'Error',
}

/** The filters of the job list that a bulk action takes over. */
export type JobListFilters = {
  q: string
  environment: Environment
  kinds: string[]
  statuses: AdminJobStatus[]
  phases: WorkflowPhase[]
}

/** The workflow filter for the job list filters. */
export type BulkScope = {
  q?: string
  environment: Environment
  kinds: string[]
  phases: WorkflowPhase[]
  // job statuses without a matching workflow phase, they are not used
  unusedStatuses: AdminJobStatus[]
  // the status and the phase filters exclude each other, so nothing can match
  empty: boolean
}

/**
 * Maps the job list filters onto a workflow filter. Statuses with a clear
 * workflow phase become phases, the other statuses are listed as not used.
 */
export function bulkScope(list: JobListFilters): BulkScope {
  const mapped = list.statuses.flatMap((s) => statusPhases[s] ?? [])
  const unusedStatuses = list.statuses.filter((s) => !statusPhases[s])
  let phases = list.phases
  if (mapped.length) {
    phases = phases.length ? phases.filter((p) => mapped.includes(p)) : mapped
  }
  return {
    q: list.q.trim() || undefined,
    environment: list.environment,
    kinds: list.kinds,
    phases,
    unusedStatuses,
    empty: mapped.length > 0 && list.phases.length > 0 && phases.length === 0,
  }
}

type Preview = { request: BulkRequest; items: BulkItem[] }

const stillRunningReason = 'Still running, stop it first'
const finishedPhases: WorkflowPhase[] = ['Succeeded', 'Failed', 'Error']

/**
 * A delete never applies to a pending or running workflow, whatever the backend
 * answers. The workflow has to be stopped first.
 */
function guardDelete(action: BulkAction, items: BulkItem[]): BulkItem[] {
  if (action !== 'delete') return items
  return items.map((w) =>
    w.applicable && (w.phase === 'Pending' || w.phase === 'Running')
      ? { ...w, applicable: false, reason: stillRunningReason }
      : w,
  )
}

const searchPageSize = 500

/**
 * The workflow names of the jobs that the search of the job list finds. The job
 * search matches organism, name and job ID, the workflow filter would only
 * match workflow names and job IDs, so the bulk action uses these names.
 */
async function searchNames(api: Pick<AdminApi, 'jobs'>, s: BulkScope): Promise<string[]> {
  const names: string[] = []
  for (let offset = 0; ; offset += searchPageSize) {
    const page = await api.jobs({
      environment: s.environment,
      q: s.q,
      limit: searchPageSize,
      offset,
    })
    names.push(...page.items.flatMap((j) => (j.workflow_name ? [j.workflow_name] : [])))
    if (!page.items.length || offset + searchPageSize >= page.total) return names
  }
}

export function useBulkPreview(
  api: Pick<AdminApi, 'bulk' | 'jobs'>,
  handleError: (e: unknown) => string,
) {
  const action = ref<BulkAction>('delete')
  const scope = shallowRef<BulkScope>()
  // text, so an empty field means any time
  const hours = ref<number | string>('')
  const preview = shallowRef<Preview>()
  const results = shallowRef<BulkItem[]>()
  const busy = ref(false)
  // a real run is on its way: the settings are locked and no second run starts
  const running = ref(false)
  const error = ref<string>()
  const applicable = computed(() => (preview.value?.items ?? []).filter((w) => w.applicable))

  // every change of the settings starts a new token, older answers are dropped
  let token = 0

  function request(): BulkRequest | undefined {
    const s = scope.value
    if (!s) return undefined
    const h = Number(hours.value)
    return {
      filter: {
        phases: s.phases.length ? s.phases : undefined,
        workflow_kinds: s.kinds.length ? s.kinds : undefined,
        finished_before_hours: hours.value === '' || !(h >= 0) ? undefined : h,
        environment: s.environment,
      },
      action: action.value,
      dry_run: true,
    }
  }

  async function load() {
    if (running.value) return
    const current = ++token
    preview.value = undefined
    results.value = undefined
    error.value = undefined
    const req = request()
    if (!req) return
    if (scope.value?.empty) {
      preview.value = { request: req, items: [] }
      return
    }
    busy.value = true
    try {
      // a search of the job list limits the preview to the workflows of the found jobs
      if (scope.value?.q) {
        req.workflow_names = await searchNames(api, scope.value)
        if (current !== token) return
        if (!req.workflow_names.length) {
          preview.value = { request: req, items: [] }
          return
        }
      }
      const result = await api.bulk(req)
      if (current === token)
        preview.value = { request: req, items: guardDelete(req.action, result.items) }
    } catch (e) {
      if (current === token) error.value = handleError(e)
    } finally {
      if (current === token) busy.value = false
    }
  }

  /** Runs the action of the shown preview on exactly its applicable workflows. */
  async function run() {
    const shown = preview.value
    if (running.value || !shown || !applicable.value.length) return
    running.value = true
    busy.value = true
    error.value = undefined
    // the result of the run is always kept, the settings cannot change meanwhile
    try {
      const request: BulkRequest = {
        ...shown.request,
        dry_run: false,
        workflow_names: applicable.value.map((w) => w.name),
      }
      // a workflow can start again between preview and run, a delete keeps only finished ones
      if (request.action === 'delete') {
        const phases = request.filter.phases?.length ? request.filter.phases : finishedPhases
        request.filter = {
          ...request.filter,
          phases: phases.filter((p) => finishedPhases.includes(p)),
        }
      }
      const result = await api.bulk(request)
      results.value = result.items
    } catch (e) {
      error.value = handleError(e)
    } finally {
      busy.value = false
      running.value = false
    }
  }

  // other settings make the shown preview invalid, at once and not after a tick;
  // during a run they are locked, so the run and its result stay
  watch(
    [action, scope, hours],
    () => {
      if (running.value) return
      token++
      preview.value = undefined
      results.value = undefined
      busy.value = false
    },
    { flush: 'sync' },
  )

  return { action, scope, hours, preview, results, applicable, busy, running, error, load, run }
}
