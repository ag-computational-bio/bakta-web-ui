<template>
  <section class="panel h-100">
    <h3 class="section-label">{{ label }}</h3>
    <div class="stat-value">{{ value }}</div>
    <div v-if="hint" class="small text-secondary">{{ hint }}</div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
}>()
</script>

<style scoped>
.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
</style>
