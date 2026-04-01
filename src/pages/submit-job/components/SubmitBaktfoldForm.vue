<template>
  <div class="mt-4">
    <div class="border rounded-3 p-4">
      <h4 class="mb-2">Bakta JSON input</h4>
      <p class="text-secondary mb-3">
        Upload a Bakta JSON result file to run Baktfold as a standalone workflow.
      </p>
      <label class="form-label" for="bakta-json">Bakta JSON</label>
      <input
        id="bakta-json"
        class="form-control form-control-lg"
        type="file"
        accept=".json"
        @change="updateBaktaJson"
      />
      <div v-if="modelValue.baktaJson" class="small text-secondary mt-2">
        <i class="bi bi-file-earmark-check me-1"></i>
        {{ modelValue.baktaJson.name }}
      </div>
    </div>
    <div class="border rounded-3 p-4 mt-3 bg-body-tertiary">
      <p class="text-secondary mb-0">
        Annotation of hypothetical protein sequences using protein structural information.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BaktfoldJobRequest } from '@/model/bakta-service'
import { computed, watch } from 'vue'

const props = defineProps<{
  modelValue: BaktfoldJobRequest
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: BaktfoldJobRequest): void
  (e: 'update:valid', v: boolean): void
}>()

const valid = computed(() => props.modelValue.baktaJson != null)

watch(
  () => valid.value,
  (value) => emit('update:valid', value),
  { immediate: true },
)

function updateBaktaJson(evt: Event) {
  if (!(evt.target instanceof HTMLInputElement)) return
  const file =
    evt.target.files == null || evt.target.files.length === 0 ? null : evt.target.files.item(0)
  emit('update:modelValue', {
    ...props.modelValue,
    baktaJson: file,
    jobName: file?.name ?? '',
  })
}
</script>
