<template>
  <div class="feature-filter" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="feature-chip"
      :class="{ active: isActive(option.value), plain: option.count == undefined }"
      :aria-pressed="isActive(option.value)"
      @click="toggle(option.value)"
    >
      {{ option.label
      }}<span v-if="option.count != undefined" class="count">{{ option.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
/*
 * A row of filter chips in the style of the feature type filter. With a single
 * value one chip is active, with a list of values several chips can be active
 * and no active chip means all.
 */
const props = defineProps<{
  options: { value: T; label: string; count?: number }[]
  label: string
}>()
const model = defineModel<T | T[]>({ required: true })

function isActive(value: T): boolean {
  return Array.isArray(model.value) ? model.value.includes(value) : model.value === value
}

function toggle(value: T) {
  if (!Array.isArray(model.value)) {
    model.value = value
    return
  }
  model.value = isActive(value)
    ? model.value.filter((v) => v !== value)
    : props.options.map((o) => o.value).filter((v) => v === value || isActive(v))
}
</script>

<style scoped>
/* chips without a count get the same padding on both sides */
.feature-chip.plain {
  padding-right: 0.875rem;
}
</style>
