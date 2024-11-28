<template>
  <select class="form-select" :id="id" v-model="value">
    <option v-for="item in visibleOptions" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    complete?: boolean
    def?: string
    id?: string
    modelValue: string
  }>(),
  {
    complete: false,
    def: 'UNKNOWN',
    id: 'select-topology',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const options = ref([
  { value: 'UNKNOWN', label: '?' },
  { value: 'c', label: 'circular' },
  { value: 'l', label: 'linear' },
])

const visibleOptions = computed(() => {
  if (props.complete) {
    return options.value.slice(1, 3)
  }
  return options.value
})
</script>
