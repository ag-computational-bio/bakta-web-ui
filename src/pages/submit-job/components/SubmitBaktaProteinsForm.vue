<template>
  <div class="mt-4">
    <div class="border rounded-3 p-4">
      <h4 class="mb-2">Protein input</h4>
      <p class="text-secondary mb-3">
        Upload a protein FASTA file to run standalone protein annotation.
      </p>
      <label class="form-label" for="protein-fasta">Protein FASTA</label>
      <input
        id="protein-fasta"
        class="form-control form-control-lg"
        type="file"
        accept=".faa,.fa,.fasta,.fsa"
        @change="updateProteinFasta"
      />
      <div v-if="modelValue.proteinFasta" class="small text-secondary mt-2">
        <i class="bi bi-file-earmark-check me-1"></i>
        {{ modelValue.proteinFasta.name }}
      </div>
    </div>
    <div class="border rounded-3 p-4 mt-3 bg-body-tertiary">
      <p class="text-secondary mb-0">
        Standalone protein annotation for provided protein sequences.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BaktaProteinsJobRequest } from '@/model/bakta-service'
import { computed, watch } from 'vue'

const props = defineProps<{
  modelValue: BaktaProteinsJobRequest
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: BaktaProteinsJobRequest): void
  (e: 'update:valid', v: boolean): void
}>()

const valid = computed(() => props.modelValue.proteinFasta != null)

watch(
  () => valid.value,
  (value) => emit('update:valid', value),
  { immediate: true },
)

function updateProteinFasta(evt: Event) {
  if (!(evt.target instanceof HTMLInputElement)) return
  const file =
    evt.target.files == null || evt.target.files.length === 0 ? null : evt.target.files.item(0)
  emit('update:modelValue', {
    ...props.modelValue,
    proteinFasta: file,
    jobName: file?.name ?? '',
  })
}
</script>
