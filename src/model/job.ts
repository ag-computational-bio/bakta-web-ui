import { z } from 'zod'

export const WorkflowKinds = ['bakta', 'bakta_baktfold', 'bakta_proteins', 'baktfold'] as const
export const WorkflowKindSchema = z.enum(WorkflowKinds)
export type WorkflowKind = z.infer<typeof WorkflowKindSchema>

export const ResultKinds = ['bakta', 'bakta_proteins', 'baktfold'] as const
export const ResultKindSchema = z.enum(ResultKinds)
export type ResultKind = z.infer<typeof ResultKindSchema>

export const UploadKinds = [
  'genome_fasta',
  'prodigal_training_file',
  'replicons_table',
  'regions_file',
  'trusted_proteins_file',
  'hmms_file',
  'protein_fasta',
  'bakta_json',
] as const
export const UploadKindSchema = z.enum(UploadKinds)
export type UploadKind = z.infer<typeof UploadKindSchema>

export const JobSchema = z.object({
  jobID: z.string(),
  secret: z.string(),
  workflowKind: WorkflowKindSchema.optional(),
})

export const ResultFileKeys = [
  'EMBL',
  'FAA',
  'FAAHypothetical',
  'FFN',
  'FNA',
  'GBFF',
  'GFF3',
  'JSON',
  'TSV',
  'TSVHypothetical',
  'TSVInference',
  'TXTLogs',
  'PNGCircularPlot',
  'SVGCircularPlot',
] as const

export const ResultFilesSchema = z.partialRecord(z.enum(ResultFileKeys), z.string())

export const JobResultSchema = z.object({
  jobID: z.string(),
  workflowKind: WorkflowKindSchema,
  resultKind: ResultKindSchema,
  name: z.string(),
  started: z.string(),
  updated: z.string(),
  ResultFiles: ResultFilesSchema,
})

export type Job = z.infer<typeof JobSchema>
export type ResultFiles = z.infer<typeof ResultFilesSchema>
export type JobResult = z.infer<typeof JobResultSchema>
export type ResultFileKey = (typeof ResultFileKeys)[number]

export function formatWorkflowKind(workflowKind: WorkflowKind | undefined): string {
  switch (workflowKind) {
    case 'bakta':
      return 'Bakta'
    case 'bakta_baktfold':
      return 'Bakta + Baktfold'
    case 'bakta_proteins':
      return 'Bakta Proteins'
    case 'baktfold':
      return 'Baktfold'
    default:
      return 'Unknown'
  }
}

export function workflowShieldProps(workflowKind: WorkflowKind | undefined): {
  icon: string
  leftClass: string
  rightClass: string
} {
  switch (workflowKind) {
    case 'bakta_baktfold':
      return { icon: 'bi-layers', leftClass: 'bg-secondary', rightClass: 'bg-primary-subtle text-primary-emphasis' }
    case 'bakta_proteins':
      return { icon: 'bi-bezier2', leftClass: 'bg-secondary', rightClass: 'bg-info-subtle text-info-emphasis' }
    case 'baktfold':
      return { icon: 'bi-stars', leftClass: 'bg-secondary', rightClass: 'bg-warning-subtle text-warning-emphasis' }
    case 'bakta':
      return { icon: 'bi-globe', leftClass: 'bg-secondary', rightClass: 'bg-success-subtle text-success-emphasis' }
    default:
      return { icon: 'bi-question-circle', leftClass: 'bg-secondary', rightClass: 'bg-secondary' }
  }
}
