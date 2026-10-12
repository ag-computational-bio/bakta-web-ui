<template>
  <input
    class="form-control"
    :class="{ 'is-invalid': error }"
    type="text"
    id="locus"
    placeholder="e.g. contig"
    v-model="modelValue"
  />
  <div v-if="error" class="invalid-feedback">{{ error }}</div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { locusError } from '@/model/locus-validation'

const modelValue = defineModel<string | null>({ required: true })
const error = computed(() => locusError(modelValue.value))
</script>
