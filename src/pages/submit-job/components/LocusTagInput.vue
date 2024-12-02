<template>
  <input
    ref="input"
    class="form-control"
    type="text"
    id="locustag"
    placeholder="Locus tag prefix (optional)"
    v-model="modelValue"
    :pattern="locusTagValidation.regex"
    :oninput="validate"
  />
</template>
<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

const modelValue = defineModel({ required: true })
const props = withDefaults(
  defineProps<{
    compliant: boolean
  }>(),
  {},
)
const input = useTemplateRef('input')
const defaultLocusTagValidation = {
  regex: '^$|^[A-Z][A-Z0-9]{2,11}$',
  message: 'Only uppercase alphanumeric characters allowed, 3-12 chars',
}
const insdcLocusTagValidation = {
  regex: '^$|^[A-Z][A-Z0-9]{2,11}$',
  message: 'Only uppercase alphanumeric characters allowed, 3-12 chars',
}
const locusTagValidation = computed(() =>
  props.compliant ? insdcLocusTagValidation : defaultLocusTagValidation,
)
function validate() {
  if (input.value) {
    if (input.value.value.match(locusTagValidation.value.regex)) input.value.setCustomValidity('')
    else input.value.setCustomValidity(locusTagValidation.value.message)
    input.value.reportValidity()
  }
}
</script>
