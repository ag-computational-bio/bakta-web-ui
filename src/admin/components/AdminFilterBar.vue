<template>
  <div class="d-flex flex-wrap align-items-center gap-3" :class="$slots.default ? 'mb-3' : 'mb-4'">
    <ChipGroup v-model="filters.environment" :options="environments" label="Environment" />
    <div class="vr d-none d-md-block"></div>
    <ChipGroup v-model="filters.range" :options="timeRanges" label="Time range" />
    <div v-if="filters.range === 'custom'" class="d-flex align-items-center gap-2">
      <input
        v-model="filters.customFrom"
        type="date"
        class="form-control form-control-sm"
        aria-label="From"
      />
      <span class="text-secondary">to</span>
      <input
        v-model="filters.customTo"
        type="date"
        class="form-control form-control-sm"
        aria-label="To"
      />
    </div>
  </div>
  <!-- more filters of a page, like the workflow kind -->
  <div v-if="$slots.default" class="mb-4">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { environments, filters, timeRanges } from '../admin-filters'
import ChipGroup from './ChipGroup.vue'
</script>
