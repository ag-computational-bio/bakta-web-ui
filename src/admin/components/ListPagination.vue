<template>
  <div v-if="total > 0" class="list-pagination d-flex flex-wrap align-items-center gap-2 mt-3">
    <span class="small text-secondary">{{ countText }}</span>
    <select
      v-if="total > pageSizes[0]"
      v-model.number="pageSize"
      class="form-select form-select-sm size"
      aria-label="Rows per page"
    >
      <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} per page</option>
    </select>
    <nav v-if="pages > 1" class="ms-auto" :aria-label="`${label} pages`">
      <ul class="pagination pagination-sm flex-wrap mb-0">
        <li class="page-item" :class="{ disabled: page === 1 }">
          <button class="page-link" aria-label="Previous page" @click="page--">
            <i class="bi bi-chevron-left"></i>
          </button>
        </li>
        <li
          v-for="(p, i) in buttons"
          :key="`${i}-${p}`"
          class="page-item"
          :class="{ active: p === page, disabled: p === 0 }"
        >
          <button class="page-link" @click="p && (page = p)">{{ p || '...' }}</button>
        </li>
        <li class="page-item" :class="{ disabled: page === pages }">
          <button class="page-link" aria-label="Next page" @click="page++">
            <i class="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCount } from '../format'
import { pageButtons, pageCount, pageSizes } from '../pagination'

/*
 * The pagination of all admin lists: "x to y of z", the page size and the page buttons.
 */
const props = defineProps<{
  total: number
  // the plural name of the rows, like "jobs"
  label: string
}>()
const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

const pages = computed(() => pageCount(props.total, pageSize.value))
const buttons = computed(() => pageButtons(page.value, pages.value))
const countText = computed(() => {
  const first = (page.value - 1) * pageSize.value + 1
  const last = Math.min(props.total, page.value * pageSize.value)
  return `${formatCount(first)} to ${formatCount(last)} of ${formatCount(props.total)} ${props.label}`
})
</script>

<style scoped>
.size {
  width: auto;
}
</style>
