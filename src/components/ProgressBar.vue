<template>
  <div>
    <div v-if="progress.title">{{ progress.title }}</div>
    <div class="progress">
      <div
        class="progress-bar bg-secondary"
        :class="classes"
        role="progressbar"
        :style="'width: ' + _progress + '%;'"
        :aria-valuenow="progress.value"
        :aria-valuemin="progress.min"
        :aria-valuemax="progress.max"
      >
        <template v-if="showLabel"> {{ _progress }} % </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Progress } from './progress'

const props = withDefaults(
  defineProps<{
    progress: Progress
    showLabel?: boolean
  }>(),
  {
    showLabel: true,
  },
)

const _progress = computed(() => {
  const p = props.progress
  const l = Math.abs(p.max - p.min)
  const cur = p.value - p.min
  const percent = Math.round((cur / l) * 100)
  return percent
})

const classes = computed(() => {
  if (props.progress.type === 'indeterminate') {
    return 'progress-bar-striped progress-bar-animated'
  } else {
    return ''
  }
})
</script>

<style>
.progress-bar {
  transition: width 0s ease;
}
</style>
