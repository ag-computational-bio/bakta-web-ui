<template>
  <div class="w-100 h-100">
    <div v-if="bakta.sequences.length > 1" class="input-group">
      <button
        class="btn btn-light"
        style="border-color: var(--bs-border-color)"
        @click="previousSeq"
        :disabled="currentPos === 0"
        title="Show previous sequence"
      >
        <i class="bi bi-chevron-left"></i>
      </button>
      <div class="flex-grow-1 form-floating">
        <select id="selectSequence" class="form-select rounded-0" v-model="currentPos">
          <option v-for="(s, idx) of bakta.sequences" :key="s.id" :value="idx">
            {{ s.id }}
          </option>
        </select>
        <label for="selectSequence">Select sequence</label>
      </div>
      <button
        class="btn btn-light"
        style="border-color: var(--bs-border-color)"
        @click="nextSeq"
        :disabled="currentPos >= sequencCount - 1"
        title="Show next sequence"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
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
    <div class="accordion" id="documentation">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#legend"
            aria-expanded="false"
            aria-controls="legend"
          >
            Color legend
          </button>
        </h2>
      </div>
      <div class="accordion-collapse collapse" id="legend" data-bs-parent="#documentation">
        <div class="accordion-body">
          <div class="d-flex">
            <div class="col">
              <h2 class="fs-5">Feature colors</h2>
              <ColorLegend :colors="featureColors" />
            </div>
            <div class="col">
              <h2 class="fs-5">CDS colors</h2>
              <ColorLegend :colors="cogHelper.baktaCogColors" />
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#gc-explanation"
            aria-expanded="false"
            aria-controls="gc-explanation"
          >
            GC and GC-skew explanations
          </button>
        </h2>
      </div>
      <div class="accordion-collapse collapse" id="gc-explanation" data-bs-parent="#documentation">
        <div class="accordion-body">
          <h2>GC-plot</h2>
          <p>
            GC-information (the percentage of G and C nucleotides in the sequence) is presented at
            two places in the plot. The overall GC-content for the whole sequence is shown in the
            center of the plot, below the sequence name. Regionspecific deviations from the overall
            GC-content are shown in the GC content track.
          </p>
          <h3>GC calculation</h3>
          <p>
            The GC-track shows 1440 values (four values per degree of the circle). This should
            present a good enough trade-off between detail and low memory usage. For each position
            the calculation takes into account the s previous and s next nucleotides, where s is the
            stepsize (seqlen/1440). The presented value in the track is the difference gc_i -
            gc_total.
          </p>

          <h2>GC-skew-plot</h2>
          <p>
            GC-skew information (the differences in the count of G and C nucleotides, normalized to
            the total amount of G and C) is presented in the GC skew track.
          </p>
          <h3>GC-skew calculation</h3>
          <p>
            The track shows 1440 values (four values per degree of the circle). This should present
            a good enough trade-off between detail and low memory usage. For each position the
            calculation takes into account the s previous and s next nucleotides, where s is the
            stepsize (seqlen/1440). Each value is calculated by |G| - |C| / |G| + |C|.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { type Result } from '@/model/result-data'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import BaktaCircularPlot from './feature-plot/BaktaCircularPlot.vue'
import BaktaLinearPlot from './feature-plot/BaktaLinearPlot.vue'
import ColorLegend from './feature-plot/ColorLegend.vue'
import cogHelper from '@/cog-helper'
import { featureColors } from './feature-plot/feature-colors'

const props = defineProps<{ bakta: Result }>()

const currentPos = ref<number>(0)
const sequencCount = computed<number>(() => props.bakta.sequences.length)
const currentId = computed<string>(() => props.bakta.sequences[currentPos.value].id)
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
    currentPos.value = 0
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

function nextSeq() {
  if (currentPos.value < sequencCount.value) {
    currentPos.value = currentPos.value + 1
  }
}

function previousSeq() {
  if (currentPos.value > 0) currentPos.value = currentPos.value - 1
}
</script>
