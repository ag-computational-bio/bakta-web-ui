<template>
  <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
    <AdminSelect
      v-model="filters.environment"
      label="Environment"
      icon="bi-hdd-stack"
      :options="environments"
    />
    <AdminSelect v-model="filters.range" label="Time range" icon="bi-calendar3" :options="ranges" />
    <div v-if="filters.range === 'custom'" class="d-flex align-items-center gap-2">
      <input
        v-model="filters.customFrom"
        type="date"
        class="form-control form-control-sm date"
        aria-label="From"
      />
      <span class="small text-secondary">to</span>
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
import { computed } from 'vue'
import { environments, filters, rangeDescription, timeRanges } from '../admin-filters'
import AdminSelect from './AdminSelect.vue'

// the dates of each preset below its name
const ranges = computed(() =>
  timeRanges.map((r) => ({ ...r, description: rangeDescription(r.value) })),
)
</script>

<style scoped>
/* the date inputs look like the dropdown buttons next to them */
.date {
  width: 9.5rem;
  border-color: var(--bs-secondary-border-subtle);
  color: var(--bs-body-color);
}
.date:hover {
  border-color: var(--bs-primary-border-subtle);
}
</style>
