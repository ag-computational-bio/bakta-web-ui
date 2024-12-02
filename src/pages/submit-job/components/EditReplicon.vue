<template>
  <tr>
    <td>
      <input class="form-control" type="text" disabled :value="modelValue.id" />
    </td>
    <td>
      <input class="form-control" type="number" disabled :value="modelValue.length" />
    </td>
    <td>
      <input type="text" v-model="newId" class="form-control" placeholder="Optional..." />
    </td>
    <td>
      <SelectSequenceType v-model="type" :complete="completeGenome" />
    </td>
    <td>
      <SelectTopology v-model="topology" :complete="completeGenome" />
    </td>
    <td>
      <input type="text" v-model="name" class="form-control" placeholder="Optional..." />
    </td>
  </tr>
</template>
<script setup lang="ts">
import type { Replicon } from '@/model/bakta-service'
import { computed } from 'vue'
import SelectSequenceType from './SelectSequenceType.vue'
import SelectTopology from './SelectTopology.vue'

const props = defineProps<{
  modelValue: Replicon
  completeGenome: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: Replicon): void
}>()

function updateReplicon(update: Partial<Replicon>) {
  emit('update:modelValue', { ...props.modelValue, ...update })
}

const type = computed({ get: () => props.modelValue.type, set: (v) => updateReplicon({ type: v }) })
const topology = computed({
  get: () => props.modelValue.topology,
  set: (v) => updateReplicon({ topology: v }),
})
const name = computed({ get: () => props.modelValue.name, set: (v) => updateReplicon({ name: v }) })
const newId = computed({ get: () => props.modelValue.new, set: (v) => updateReplicon({ new: v }) })
</script>
