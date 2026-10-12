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

defineOptions({
  name: 'AppShield',
})

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
.shield {
  display: inline-flex;
  white-space: nowrap;
}
.shield .left {
  border-radius: var(--bs-border-radius-sm) 0 0 var(--bs-border-radius-sm);
}
.shield .right {
  border-radius: 0 var(--bs-border-radius-sm) var(--bs-border-radius-sm) 0;
}
</style>
