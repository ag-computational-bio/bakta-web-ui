<template>
  <input
    ref="input"
    class="form-control"
    type="text"
    id="locus"
    placeholder="Locus prefix (optional)"
    v-model="modelValue"
    :oninput="validate"
  />
</template>
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const modelValue = defineModel({ required: true })
const input = useTemplateRef('input')
const locusValidation = {
  regex: '^$|^[#.*A-Za-z0-9_-]{1,20}$',
  message: 'Only alphanumeric charaters and _-*.# allowed, max 20 chars',
}

function validate() {
  if (input.value) {
    if (input.value.value.match(locusValidation.regex)) input.value.setCustomValidity('')
    else input.value.setCustomValidity(locusValidation.message)
    input.value.reportValidity()
  }
}
</script>
