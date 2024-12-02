<template>
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Original sequence id</th>
        <th>Length</th>
        <th>New sequence id</th>
        <th>Type</th>
        <th>Topology</th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <EditReplicon
        v-for="(item, idx) in modelValue"
        :key="item.id"
        :model-value="item"
        :complete-genome="completeGenome"
        @update:model-value="(evt) => update(idx, evt)"
      />
    </tbody>
  </table>
</template>
<script setup lang="ts">
import type { Replicon } from '@/model/bakta-service'
import EditReplicon from './EditReplicon.vue'

const props = defineProps<{
  modelValue: Replicon[]
  completeGenome: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: Replicon[]): void
}>()

function update(idx: number, r: Replicon) {
  const copy = [...props.modelValue]
  copy[idx] = r
  emit('update:modelValue', copy)
}
</script>
