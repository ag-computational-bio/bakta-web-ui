import type { AdminJobStatus, JobRecord } from './admin-api'
import type { WorkflowKind } from '@/model/job'

/*
 * Generated jobs for the mock admin API: a few hundred jobs over two years with
 * all statuses and workflow kinds and plausible runtimes.
 */

// small seeded random generator, so every reload shows the same data
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = random(42)

function pick<T>(items: [T, number][]): T {
  let r = rnd() * items.reduce((sum, [, weight]) => sum + weight, 0)
  for (const [item, weight] of items) {
    r -= weight
    if (r <= 0) return item
  }
  return items[items.length - 1][0]
}

export function uuid(): string {
  const hex = () => Math.floor(rnd() * 16).toString(16)
  return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, hex)
}

const organisms: [string, string, string | null, number, number][] = [
  ['Escherichia', 'coli', 'Sakai', 5_594_605, 3],
  ['Escherichia', 'coli', 'K-12 MG1655', 4_641_652, 1],
  ['Staphylococcus', 'aureus', 'USA300', 2_872_769, 3],
  ['Pseudomonas', 'aeruginosa', 'PAO1', 6_264_404, 1],
  ['Klebsiella', 'pneumoniae', null, 5_682_322, 7],
  ['Bacillus', 'subtilis', '168', 4_215_606, 1],
  ['Mycobacterium', 'tuberculosis', 'H37Rv', 4_411_532, 1],
  ['Salmonella', 'enterica', 'LT2', 4_951_383, 2],
  ['Acinetobacter', 'baumannii', null, 3_936_291, 84],
  ['Enterococcus', 'faecium', null, 2_998_039, 112],
]

const versionHistory = [
  { until: '2024-12-01', bakta: '1.9.4', db: '5.1' },
  { until: '2025-06-01', bakta: '1.10.4', db: '6.0' },
  { until: '2026-02-01', bakta: '1.11.0', db: '6.0' },
  { until: '9999-01-01', bakta: '1.12.2', db: '6.0' },
]

export const day = 86_400_000

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

function finalStatus(): AdminJobStatus {
  return pick<AdminJobStatus>([
    ['succeeded', 85],
    ['failed', 6],
    ['error', 2],
    ['expired', 5],
    ['deleted', 2],
  ])
}

function activeStatus(): AdminJobStatus {
  return pick<AdminJobStatus>([
    ['created', 1],
    ['submitted', 1],
    ['running', 3],
  ])
}

function createJob(createdMs: number, now: number): JobRecord {
  const kind = pick<WorkflowKind>([
    ['bakta', 70],
    ['bakta_baktfold', 12],
    ['bakta_proteins', 10],
    ['baktfold', 8],
  ])
  const environment = pick([
    ['production', 85],
    ['staging', 15],
  ])
  const [genus, species, strain, length, contigs] = pick(organisms.map((o) => [o, 1]))
  const fromFasta = kind === 'bakta' || kind === 'bakta_baktfold'
  const totalLength = Math.round(length * (0.95 + rnd() * 0.1))
  const status = now - createdMs < 3_600_000 ? activeStatus() : finalStatus()
  const queue = 2 + rnd() * rnd() * 120
  const factor = kind === 'baktfold' ? 4 : kind === 'bakta_baktfold' ? 5 : 1
  const runtime = (90 + (totalLength / 1e6) * 60) * factor * (0.7 + rnd() * rnd() * 1.5)
  const submittedMs = createdMs + 20_000 + rnd() * 60_000
  const startedMs =
    status === 'created' || status === 'submitted' ? null : submittedMs + queue * 1000
  const finished = startedMs != null && status !== 'running'
  const runtimeSeconds = status === 'failed' || status === 'error' ? runtime * rnd() : runtime
  const finishedMs = finished && startedMs != null ? startedMs + runtimeSeconds * 1000 : null
  const version = versionHistory.find((v) => iso(createdMs) < v.until) ?? versionHistory[0]
  const withBaktfold = kind === 'baktfold' || kind === 'bakta_baktfold'
  const id = uuid()
  return {
    id,
    environment,
    workflow_kind: kind,
    api_version: createdMs < now - 400 * day && rnd() < 0.7 ? 'v1' : 'v2',
    status,
    name: rnd() < 0.8 ? `${genus} ${species} ${strain ?? 'isolate'}` : null,
    genus: fromFasta ? genus : null,
    species: fromFasta ? species : null,
    strain: fromFasta ? strain : null,
    sequence_count: fromFasta ? contigs : null,
    total_length: fromFasta ? totalLength : null,
    config: fromFasta ? mockConfig(genus, species, strain, contigs === 1) : null,
    bakta_version: kind === 'baktfold' ? null : version.bakta,
    bakta_db_version: kind === 'baktfold' ? null : version.db,
    baktfold_version: withBaktfold ? '0.3.0' : null,
    baktfold_db_version: withBaktfold ? '0.3' : null,
    workflow_name: status === 'created' ? null : `${kind.replace('_', '-')}-job-${id.slice(0, 8)}`,
    created_at: iso(createdMs),
    submitted_at: status === 'created' ? null : iso(submittedMs),
    started_at: startedMs == null ? null : iso(startedMs),
    finished_at: finishedMs == null ? null : iso(finishedMs),
    runtime_seconds: finishedMs == null ? null : runtimeSeconds,
    queue_seconds: startedMs == null ? null : queue,
    error_message:
      status === 'failed'
        ? 'bakta exited with code 1'
        : status === 'error'
          ? 'pod was evicted'
          : null,
    updated_at: iso(finishedMs ?? startedMs ?? createdMs),
  }
}

function mockConfig(genus: string, species: string, strain: string | null, complete: boolean) {
  return {
    genus,
    species,
    strain,
    plasmid: null,
    complete_genome: complete,
    translation_table: 11,
    derm_type: pick([
      ['unknown', 3],
      ['diderm', 1],
    ]),
    locus: null,
    locus_tag: null,
    locus_tag_increment: 1,
    min_contig_length: 1,
    keep_contig_headers: false,
    compliant: rnd() < 0.2,
    meta: false,
    skip_plot: false,
    skip_crispr: false,
    skip_pseudo: false,
    use_replicons: complete,
    use_prodigal_training_file: false,
  }
}

export function createJobs(): JobRecord[] {
  const now = Date.now()
  const jobs: JobRecord[] = []
  // more jobs in recent months, like a growing service
  for (let i = 0; i < 420; i++) {
    const age = Math.pow(rnd(), 1.6) * 730 * day
    jobs.push(createJob(now - age, now))
  }
  // a few jobs that are still running right now
  for (let i = 0; i < 6; i++) jobs.push(createJob(now - rnd() * 1_800_000, now))
  return jobs.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
