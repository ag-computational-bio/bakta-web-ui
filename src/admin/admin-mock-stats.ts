import type { InputStats, JobRecord, RuntimeStats } from './admin-api'
import { percentile } from './format'

/*
 * Runtime and input statistics of the mock admin API, computed from the mock
 * jobs like the backend does it in SQL.
 */

const runtimeEdges = [0, 120, 300, 600, 1200, 1800, 3600, 7200, 14400]
export const sizeEdges = [0, 1e6, 2e6, 4e6, 6e6, 8e6, 12e6]
// lower edges of the sequence count buckets, the upper edges are inclusive
const sequenceEdges = [1, 2, 6, 21, 101, 501, 2001]

function sorted(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v != null).sort((a, b) => a - b)
}

export function avg(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

// the sample standard deviation, like stddev in Postgres
function stddev(values: number[]): number | null {
  const mean = avg(values)
  if (mean == null || values.length < 2) return null
  const sum = values.reduce((s, v) => s + (v - mean) ** 2, 0)
  return Math.sqrt(sum / (values.length - 1))
}

/**
 * Fixed buckets from a list of lower edges, the last bucket has no upper edge.
 */
export function buckets<T>(edges: number[], items: T[], value: (item: T) => number) {
  return edges.map((min, i) => {
    const max = i + 1 < edges.length ? edges[i + 1] : null
    return {
      min,
      max,
      items: items.filter((t) => value(t) >= min && (max == null || value(t) < max)),
    }
  })
}

export function organism(job: JobRecord): string | null {
  return [job.genus, job.species, job.strain].filter(Boolean).join(' ') || null
}

/**
 * The runtime statistics of the given jobs. Runtimes only use succeeded jobs.
 */
export function runtimeStats(jobs: JobRecord[]): RuntimeStats {
  const done = jobs.filter((j) => j.outcome === 'succeeded' && j.runtime_seconds != null)
  const runtime = (j: JobRecord) => j.runtime_seconds ?? 0
  const kinds = [...new Set(done.map((j) => j.workflow_kind))].sort()
  const perMbp = sorted(
    done.filter((j) => j.total_length).map((j) => runtime(j) / ((j.total_length ?? 1) / 1e6)),
  )
  const queue = sorted(jobs.map((j) => j.queue_seconds))
  return {
    jobs: done.length,
    by_workflow_kind: kinds.map((kind) => {
      const values = sorted(done.filter((j) => j.workflow_kind === kind).map(runtime))
      return {
        workflow_kind: kind,
        jobs: values.length,
        min: values[0] ?? null,
        p10: percentile(values, 0.1),
        p25: percentile(values, 0.25),
        p50: percentile(values, 0.5),
        p75: percentile(values, 0.75),
        p90: percentile(values, 0.9),
        p95: percentile(values, 0.95),
        p99: percentile(values, 0.99),
        max: values[values.length - 1] ?? null,
        avg: avg(values),
        stddev: stddev(values),
      }
    }),
    histogram: buckets(runtimeEdges, done, runtime).map((b) => ({
      min_seconds: b.min,
      max_seconds: b.max,
      jobs: b.items.length,
    })),
    by_input_size: buckets(
      sizeEdges,
      done.filter((j) => j.total_length != null),
      (j) => j.total_length ?? 0,
    ).map((b) => {
      const values = sorted(b.items.map(runtime))
      return {
        min_bp: b.min,
        max_bp: b.max,
        jobs: values.length,
        runtime_p50: percentile(values, 0.5),
        runtime_p90: percentile(values, 0.9),
        runtime_avg: avg(values),
      }
    }),
    seconds_per_mbp: { p50: percentile(perMbp, 0.5), avg: avg(perMbp) },
    queue_seconds: {
      avg: avg(queue),
      p50: percentile(queue, 0.5),
      p90: percentile(queue, 0.9),
      p99: percentile(queue, 0.99),
      max: queue[queue.length - 1] ?? null,
    },
    slowest: [...done]
      .sort((a, b) => runtime(b) - runtime(a))
      .slice(0, 10)
      .map((j) => ({
        id: j.id,
        workflow_kind: j.workflow_kind,
        organism: organism(j),
        total_length: j.total_length,
        runtime_seconds: runtime(j),
        created_at: j.created_at,
      })),
  }
}

/**
 * The input statistics of the given jobs, over jobs with a total length.
 */
export function inputStats(jobs: JobRecord[]): InputStats {
  const withLength = jobs.filter((j) => j.total_length != null)
  const length = (j: JobRecord) => j.total_length ?? 0
  const sizes = sorted(withLength.map(length))
  const withCount = withLength.filter((j) => j.sequence_count != null)
  const counts = sorted(withCount.map((j) => j.sequence_count))
  const kinds = [...new Set(withLength.map((j) => j.workflow_kind))].sort()
  return {
    jobs: withLength.length,
    total_bp: sizes.reduce((a, b) => a + b, 0),
    total_length: {
      min: sizes[0] ?? null,
      p10: percentile(sizes, 0.1),
      p25: percentile(sizes, 0.25),
      p50: percentile(sizes, 0.5),
      p75: percentile(sizes, 0.75),
      p90: percentile(sizes, 0.9),
      p99: percentile(sizes, 0.99),
      max: sizes[sizes.length - 1] ?? null,
      avg: avg(sizes),
    },
    sequence_count: {
      min: counts[0] ?? null,
      p50: percentile(counts, 0.5),
      p90: percentile(counts, 0.9),
      p99: percentile(counts, 0.99),
      max: counts[counts.length - 1] ?? null,
      avg: avg(counts),
    },
    size_histogram: buckets(sizeEdges, withLength, length).map((b) => ({
      min_bp: b.min,
      max_bp: b.max,
      jobs: b.items.length,
    })),
    sequence_histogram: buckets(sequenceEdges, withCount, (j) => j.sequence_count ?? 0).map(
      (b) => ({
        min_sequences: b.min,
        max_sequences: b.max == null ? null : b.max - 1,
        jobs: b.items.length,
      }),
    ),
    by_workflow_kind: kinds.map((kind) => {
      const ofKind = withLength.filter((j) => j.workflow_kind === kind)
      const values = sorted(ofKind.map(length))
      return {
        workflow_kind: kind,
        jobs: values.length,
        total_bp: values.reduce((a, b) => a + b, 0),
        p50_bp: percentile(values, 0.5),
        avg_bp: avg(values),
        p50_sequences: percentile(sorted(ofKind.map((j) => j.sequence_count)), 0.5),
      }
    }),
    largest: [...withLength]
      .sort((a, b) => length(b) - length(a))
      .slice(0, 10)
      .map((j) => ({
        id: j.id,
        workflow_kind: j.workflow_kind,
        organism: organism(j),
        total_length: length(j),
        sequence_count: j.sequence_count,
        status: j.status,
        created_at: j.created_at,
      })),
  }
}
