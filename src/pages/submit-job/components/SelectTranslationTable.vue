<template>
  <select class="form-select" :id="id" v-model="value">
    <option v-for="item in options" :key="item.value" :value="item.value">
      {{ item.value }}: {{ item.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    def?: number
    modelValue: number
  }>(),
  {
    id: 'select-translation',
    def: 11,
  },
)

const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()

const options = ref([
  {
    value: 4,
    label:
      'The Mold, Protozoan, and Coelenterate Mitochondrial Code and the Mycoplasma/Spiroplasma Code',
  },
  {
    value: 11,
    label: 'The Bacterial, Archaeal and Plant Plastid Code',
  },
])
</script>
