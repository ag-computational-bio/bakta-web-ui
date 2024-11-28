<template>
  <select class="form-select" :id="id" v-model="value">
    <option v-for="item in options" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    def?: string
    modelValue: string
  }>(),
  { def: 'UNKNOWN', id: 'select-derm-type' },
)
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const options = ref([
  { value: 'UNKNOWN', label: '?' },
  { value: 'MONODERM', label: 'Monoderm' },
  { value: 'DIDERM', label: 'Diderm' },
])
</script>
