<template>
  <textarea
    ref="el"
    class="form-control"
    name="paste-fasta"
    rows="8"
    placeholder="Paste your fasta sequences here or select a fasta file from your computer below..."
    v-model="sequenceInput"
  ></textarea>
</template>
<script setup lang="ts">
import { parseFasta, type Seq, type SequenceInput } from '@/fasta/parse-fasta'
import { computed, ref, useTemplateRef } from 'vue'

const emit = defineEmits<{
  (e: 'update:sequences', v: SequenceInput): void
}>()

const input = ref('')
const textarea = useTemplateRef('el')
const sequenceInput = computed({
  get: () => input.value,
  set: (v) => {
    input.value = v
    let p: Seq[] = []
    try {
      p = parseFasta(v)
    } catch {
      // ignore
    }
    if (p.length > 0) {
      emit('update:sequences', { sequence: v, parsed: p })
    } else {
      emit('update:sequences', { sequence: '', parsed: [] })
      if (textarea.value) {
        if (v.trim().length !== 0) {
          textarea.value.setCustomValidity('Invalid fasta')
        } else {
          textarea.value.setCustomValidity('')
        }
        textarea.value.reportValidity()
      }
    }
  },
})

function reset() {
  input.value = ''
}

defineExpose({ reset })
</script>
