import { computed, ref, watch, type Ref } from 'vue'

/*
 * Paging helpers of the admin lists. The server pages the job list, all other
 * lists come complete and are paged here in the browser.
 */

export const pageSizes = [10, 25, 50, 100] as const

/**
 * The number of pages for a list, at least one.
 */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * The page, moved back to the last page when the list got shorter.
 */
export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.max(1, Math.min(page, pageCount(total, pageSize)))
}

/**
 * The page buttons: first, last and the pages around the current one. 0 stands for a gap.
 */
export function pageButtons(page: number, pages: number, around = 1): number[] {
  const list: number[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= around) list.push(p)
    else if (list[list.length - 1] !== 0) list.push(0)
  }
  return list
}

/**
 * A page and a page size for a complete list. The page goes back when the
 * list gets shorter, and to the first page when the page size changes.
 */
export function useClientPages<T>(items: Ref<T[]>, size = 25) {
  const page = ref(1)
  const pageSize = ref(size)
  watch(pageSize, () => (page.value = 1))
  watch(
    () => pageCount(items.value.length, pageSize.value),
    (pages) => (page.value = Math.min(page.value, pages)),
  )
  const pageItems = computed(() =>
    items.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
  )
  return { page, pageSize, pageItems }
}
