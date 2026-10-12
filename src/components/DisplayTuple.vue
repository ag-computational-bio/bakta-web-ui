<template>
  <div class="row py-1">
    <div class="label" :class="labelClass">{{ label }}</div>
    <div class="value" :class="valueClass">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    break?: number
  }>(),
  {
    break: 5,
  },
)
const labelClass = computed(() => 'col-' + props.break)
const valueClass = computed(() => 'col-' + (12 - props.break))
</script>

<style scoped>
.label {
  color: var(--bs-secondary-color);
}
.value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
