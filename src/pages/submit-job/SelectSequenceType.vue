<template>
  <select class="form-select" ref="select" :id="id" v-model="value">
    <option v-for="item in visibleOptions" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    complete?: boolean
    def?: string
    id?: string
  }>(),
  {},
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const options = ref([
  { value: 'UNKNOWN', label: '?' },
  { value: 'chromosome', label: 'Chromosome' },
  { value: 'plasmid', label: 'Plasmid' },
  { value: 'contig', label: 'Contig' },
])

const visibleOptions = computed(() => {
  if (props.complete) {
    return options.value.slice(1, 3)
  }
  return options.value
})

const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
</script>
