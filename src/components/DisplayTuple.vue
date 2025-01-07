<template>
  <div class="row">
    <div class="label text-end" :class="labelClass">{{ label }}</div>
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
    break: 4,
  },
)
const labelClass = computed(() => 'col-' + props.break)
const valueClass = computed(() => 'col-' + (12 - props.break))
</script>

<style>
.label {
  font-weight: bold;
}
.value {
  font-weight: bold;
  color: gray;
}
</style>
