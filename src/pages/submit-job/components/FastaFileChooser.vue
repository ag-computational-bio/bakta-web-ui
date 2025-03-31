<template>
  <input
    ref="input"
    class="form-control"
    :class="props.class"
    type="file"
    id="fastaFile"
    @change="fileUpdated"
    :disabled="_progress != undefined"
  />
  <ProgressBar v-if="_progress" :progress="_progress" title="Loading fasta file..." />
  <Notification v-if="error" class="mt-2" :message="error" type="danger" />
</template>
<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { useProgress, type Progress } from '@/components/progress'
import ProgressBar from '@/components/ProgressBar.vue'
import { parseFasta, type Seq, type SequenceInput } from '@/fasta/parse-fasta'
import read_gzip_file from '@/read-file-with-progress'
import { ref, useTemplateRef } from 'vue'
const props = withDefaults(
  defineProps<{
    class?: string
  }>(),
  {},
)

const emit = defineEmits<{
  (e: 'update:sequences', v: SequenceInput): void
}>()

const _progress = ref<Progress>()

const error = ref<string>()
function fileUpdated(evt: Event) {
  error.value = undefined
  if (evt.target instanceof HTMLInputElement) {
    const files = evt.target.files
    if (files == null || files.length == 0) {
      emit('update:sequences', { sequence: '', parsed: [], name: '' })
    } else {
      const file = files.item(0) as File
      readFile(file)
        .then(({ sequence, parsed }) => {
          emit('update:sequences', { sequence: sequence, parsed: parsed, name: file.name })
        })
        .catch((err: string) => {
          error.value = 'Invalid fasta file: ' + err
          _progress.value = undefined
          emit('update:sequences', { sequence: '', parsed: [], name: '' })
        })
    }
  }
}

function readFile(f: File): Promise<{ sequence: string; parsed: Seq[] }> {
  const { progress, updateProgress } = useProgress({ min: 0, max: 1 })
  _progress.value = progress
  return read_gzip_file(f, updateProgress).then((buffer) => {
    const decoder = new TextDecoder('utf-8')
    const sequenceString = decoder.decode(buffer)
    const parsed = parseFasta(sequenceString)
    _progress.value = undefined
    return { sequence: sequenceString, parsed }
  })
}

const input = useTemplateRef('input')
function reset() {
  if (input.value) input.value.value = ''
}
defineExpose({ reset })
</script>
