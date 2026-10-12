<template>
  <input
    ref="input"
    class="form-control"
    :class="{ 'is-invalid': error }"
    type="text"
    id="locustag"
    placeholder="e.g. ESAKAI"
    v-model="modelValue"
  />
  <div v-if="error" class="invalid-feedback">{{ error }}</div>
  <div v-else class="form-text">{{ locusTagHelp(compliant) }}</div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { locusTagError, locusTagHelp } from '@/model/locus-validation'

const modelValue = defineModel<string | null>({ required: true })
const props = withDefaults(
  defineProps<{
    compliant: boolean
  }>(),
  {},
)
const error = computed(() => locusTagError(modelValue.value, props.compliant))
</script>
