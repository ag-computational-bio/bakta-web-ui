<template>
  <div class="w-100 h-100">
    <div v-if="bakta.sequences.length > 1" class="form-floating">
      <select id="selectSequence" class="form-select" v-model="currentId">
        <option v-for="s of bakta.sequences" :key="s.id" :value="s.id">
          {{ s.id }}
        </option>
      </select>
      <label for="selectSequence">Select sequence</label>
    </div>
    <select v-if="false" v-model="type">
      <option value="circular">circular</option>
      <option value="linear">linear</option>
    </select>
    <div class="my-2 w-100 h-100" ref="comp">
      <BaktaCircularPlot
        v-if="data.seq && type == 'circular'"
        :sequence="data.seq"
        :features="data.feat"
        :size="size"
      />
      <BaktaLinearPlot
        v-if="data.seq && type == 'linear'"
        :sequence="data.seq"
        :features="data.feat"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { type Result } from '@/model/result-data'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import BaktaCircularPlot from './feature-plot/BaktaCircularPlot.vue'
import BaktaLinearPlot from './feature-plot/BaktaLinearPlot.vue'

const props = defineProps<{ bakta: Result }>()

const currentId = ref<string>('')
const type = ref<'circular' | 'linear'>('circular')
const size = ref({ width: 1000, height: 1000 })
const data = computed(() => ({
  seq: props.bakta.sequences.find((x) => x.id == currentId.value),
  feat: props.bakta.features.filter((x) => x.sequence === currentId.value),
}))

const component = useTemplateRef('comp')
let resizeObs: ResizeObserver | null = null
onMounted(() => {
  if (props.bakta.sequences.length > 0) {
    currentId.value = props.bakta.sequences[0].id
  }
  if (component.value) {
    resizeObs = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (component.value) {
          const bbox = component.value.getBoundingClientRect()
          const max = Math.max(bbox.width, bbox.height)
          if (size.value.width !== max) size.value = { width: max, height: max }
        }
      })
    })
    resizeObs.observe(component.value)
  }
})
onUnmounted(() => {
  if (resizeObs) resizeObs.disconnect()
})
</script>
