import { reactive } from 'vue'

export type ProgressType = 'static' | 'indeterminate'
export type Progress = {
  min: number
  max: number
  value: number
  type: ProgressType
  title?: string
}

export function useProgress(config?: Partial<Progress>): {
  progress: Progress
  updateProgress: (n: number) => void
} {
  const progress: Progress = reactive({
    min: 0,
    max: 100,
    value: 0,
    type: 'static',
    ...config,
  })

  const updateProgress = (n: number) => (progress.value = n)
  return { progress, updateProgress }
}
