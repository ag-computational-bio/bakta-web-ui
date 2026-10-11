<template>
  <section class="panel h-100">
    <h3 class="section-label">{{ label }}</h3>
    <div class="stat-value">{{ value }}</div>
    <div v-if="hint" class="small text-secondary">{{ hint }}</div>
    <div v-if="change" class="small text-secondary">{{ change }}</div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
  // the change against the previous period, like "+12% vs previous 30 days"
  change?: string
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
