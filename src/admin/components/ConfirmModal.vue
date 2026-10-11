<template>
  <div ref="element" class="modal fade" tabindex="-1" aria-hidden="true" :aria-labelledby="titleId">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h3 :id="titleId" class="modal-title section-title mb-0">{{ title }}</h3>
          <button
            type="button"
            class="btn-close"
            aria-label="Cancel"
            @click="close(false)"
          ></button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" @click="close(false)">
            Cancel
          </button>
          <button
            type="button"
            class="btn"
            :class="danger ? 'btn-outline-danger' : 'btn-primary'"
            @click="close(true)"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Modal } from 'bootstrap'
import { onMounted, onUnmounted, ref, useId } from 'vue'

/*
 * A Bootstrap modal that asks before an action. open() resolves with true when
 * the action was confirmed and with false when the modal was closed.
 */
defineProps<{
  title: string
  confirmLabel: string
  danger?: boolean
}>()

// the title names the dialog for screen readers
const titleId = useId()
const element = ref<HTMLElement>()
let modal: Modal | undefined
let resolve: ((confirmed: boolean) => void) | undefined

function close(confirmed: boolean) {
  resolve?.(confirmed)
  resolve = undefined
  modal?.hide()
}

function open(): Promise<boolean> {
  modal?.show()
  return new Promise((r) => (resolve = r))
}

const onHidden = () => close(false)
onMounted(() => {
  if (!element.value) return
  modal = new Modal(element.value)
  element.value.addEventListener('hidden.bs.modal', onHidden)
})
onUnmounted(() => {
  element.value?.removeEventListener('hidden.bs.modal', onHidden)
  modal?.dispose()
})

defineExpose({ open })
</script>

<style scoped>
.modal {
  --bs-modal-border-radius: var(--bs-border-radius-lg);
  --bs-modal-inner-border-radius: calc(var(--bs-border-radius-lg) - 1px);
  --bs-modal-border-color: var(--bs-border-color);
}
</style>
