<template>
  <span class="shield">
    <span :class="_leftClass">
      <span :class="_iconClass"></span>
    </span>
    <span :class="_rightClass">
      <slot></slot>
    </span>
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icon?: string
    leftClass?: string
    rightClass?: string
  }>(),
  {
    icon: 'bi-globe',
    leftClass: 'bg-secondary',
    rightClass: 'bg-success',
  },
)

const _leftClass = computed(() => 'badge left ' + props.leftClass)
const _rightClass = computed(() => 'badge right ' + props.rightClass)
const _iconClass = computed(() => 'bi ' + props.icon)
</script>
<style scoped>
.shield .left {
  border-radius: 0.25rem 0rem 0rem 0.25rem;
}
.shield .right {
  border-radius: 0rem 0.25rem 0.25rem 0rem;
}
</style>
