<template>
  <h5>{{ feature.id }}</h5>
  <table class="table table-sm">
    <tbody>
      <tr>
        <td class="text-end">Type</td>
        <td>
          <div
            style="width: 1rem; height: 1rem; display: inline-block"
            :style="`background-color: ${lookupFeatureColor(feature)}`"
          ></div>
          {{ feature.type }}
        </td>
      </tr>
      <tr v-if="feature.strand">
        <td class="text-end">Strand</td>
        <td>{{ feature.strand }}</td>
      </tr>
      <tr>
        <td class="text-end">Coordinates</td>
        <td>
          {{
            feature.strand == '-'
              ? `${feature.stop}-${feature.start}`
              : `${feature.start}-${feature.stop}`
          }}
        </td>
      </tr>
      <tr v-if="feature.frame">
        <td class="text-end">Frame</td>
        <td>{{ feature.frame }}</td>
      </tr>

      <tr>
        <td class="text-end">Length</td>
        <td>{{ formatBp(feature.stop - feature.start, 'bp') }}</td>
      </tr>
      <tr>
        <td class="text-end">Locus</td>
        <td>{{ feature.locus ?? '-' }}</td>
      </tr>
      <tr>
        <td class="text-end">Gene</td>
        <td>{{ feature.gene ?? '-' }}</td>
      </tr>
      <tr>
        <td class="text-end">Product</td>
        <td>{{ feature.product ?? '-' }}</td>
      </tr>
      <tr v-if="cog.length > 0">
        <td class="text-end">Cog</td>
        <td>
          <template v-for="(e, idx) of cog" :key="e.key">
            <template v-if="idx > 0"><br /> </template>
            <div
              style="display: inline-block; width: 1rem; height: 1rem"
              :style="`background-color: ${e.color}`"
            ></div>
            {{ e.name[0] }}
          </template>
        </td>
      </tr>
      <tr v-if="feature.sequence">
        <td class="text-end">GC</td>
        <td>
          {{ formatGc(calcGcContent(feature.sequence, 1, false).mean) }}
        </td>
      </tr>
      <tr v-if="feature.rbs_motif">
        <td class="text-end">RBS motif</td>
        <td>{{ feature.rbs_motif }}</td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts">
import baktaHelper from '@/bakta-helper'
import cogHelper from '@/cog-helper'
import type { Feature } from '@/model/result-data'
import { computed } from 'vue'
import { formatBp } from '../circluar-plot/formatters'
import { lookupFeatureColor } from '../feature-colors'
import { formatGc } from '../formatters'
import { calcGcContent } from '../gc-content'

const props = defineProps<{
  feature: Feature
}>()

const cog = computed(() => {
  const labels = baktaHelper.lookupCogFunctionalCategories(props.feature)

  const config = labels.map((l) => ({
    key: l,
    name: cogHelper.lookupCogLabels([l]),
    color: cogHelper.lookupCogColor([l]),
  }))
  return config
})
</script>
