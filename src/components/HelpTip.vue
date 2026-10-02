<template>
  <button
    ref="button"
    type="button"
    class="help-tip"
    :aria-label="text"
    data-bs-toggle="tooltip"
    :data-bs-title="text"
  >
    <i class="bi bi-question-circle" aria-hidden="true"></i>
  </button>
</template>

<script setup lang="ts">
import { Tooltip } from 'bootstrap'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

defineOptions({
  name: 'AppHelpTip',
})

defineProps<{
  /** The explanation that is shown in the tooltip. */
  text: string
}>()

const button = useTemplateRef('button')
let tooltip: Tooltip | undefined

onMounted(() => {
  // The tooltip is added to the body, so cards and tables do not cut it off.
  if (button.value)
    tooltip = new Tooltip(button.value, { container: 'body', trigger: 'hover focus' })
})
onBeforeUnmount(() => tooltip?.dispose())
</script>

<style scoped>
.help-tip {
  display: inline-block;
  padding: 0;
  border: 0;
  background: none;
  font-size: 0.95em;
  line-height: 1;
  color: var(--bs-secondary-color);
  cursor: help;
}
.help-tip:hover {
  color: var(--bs-primary);
}
.help-tip:focus-visible {
  border-radius: 50%;
  outline: 2px solid rgba(var(--bs-primary-rgb), 0.5);
  outline-offset: 2px;
}
</style>
