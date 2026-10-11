<template>
  <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
    <select
      v-model="filters.environment"
      class="form-select form-select-sm filter"
      aria-label="Environment"
    >
      <option v-for="option in environments" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <select
      v-model="filters.range"
      class="form-select form-select-sm filter"
      aria-label="Time range"
    >
      <option v-for="option in timeRanges" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <div v-if="filters.range === 'custom'" class="d-flex align-items-center gap-2">
      <input
        v-model="filters.customFrom"
        type="date"
        class="form-control form-control-sm date"
        aria-label="From"
      />
      <span class="text-secondary">to</span>
      <input
        v-model="filters.customTo"
        type="date"
        class="form-control form-control-sm date"
        aria-label="To"
      />
    </div>
    <!-- more filters of a page, like the workflow kind -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { environments, filters, timeRanges } from '../admin-filters'
</script>

<style scoped>
.filter {
  width: auto;
}
.date {
  width: 9.5rem;
}
</style>
