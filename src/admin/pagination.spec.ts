import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { clampPage, pageButtons, pageCount, useClientPages } from './pagination'

describe('pageButtons', () => {
  it('shows the first, the last and the pages around the current one', () => {
    expect(pageButtons(1, 1)).toEqual([1])
    expect(pageButtons(5, 10)).toEqual([1, 0, 4, 5, 6, 0, 10])
    expect(pageButtons(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('has at least one page', () => {
    expect(pageCount(0, 25)).toBe(1)
    expect(pageCount(51, 25)).toBe(3)
  })
})

describe('clampPage', () => {
  it('moves back to the last page when the list got shorter', () => {
    expect(clampPage(3, 50, 25)).toBe(2)
    expect(clampPage(2, 0, 25)).toBe(1)
    expect(clampPage(2, 51, 25)).toBe(2)
    expect(clampPage(0, 51, 25)).toBe(1)
  })
})

describe('useClientPages', () => {
  it('slices the list and goes back when it gets shorter', async () => {
    const items = ref(Array.from({ length: 30 }, (_, i) => i))
    const { page, pageItems } = useClientPages(items, 10)
    page.value = 3
    expect(pageItems.value).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
    items.value = items.value.slice(0, 15)
    await nextTick()
    expect(page.value).toBe(2)
    expect(pageItems.value).toEqual([10, 11, 12, 13, 14])
  })
})
