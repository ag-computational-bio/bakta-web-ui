import type { Meta, StoryObj } from '@storybook/vue3'

import BaktaCircularPlot from './BaktaCircularPlot.vue'

import { ref } from 'vue'
import type { Result } from '@/model/result-data'
import { fixtures } from '@/test-data/bakta-results'
const meta: Meta<typeof BaktaCircularPlot> = {
  component: BaktaCircularPlot,
}

const result: Result = fixtures.result['1.10']

export default meta
type Story = StoryObj<typeof BaktaCircularPlot>

export const Default: Story = {
  args: { sequence: result.sequences[0], features: result.features },
  render: (args) => ({
    components: { BaktaCircularPlot },
    setup() {
      let cur = 0
      const seq = ref(result.sequences[0])
      const feat = ref(result.features.filter((x) => x.sequence === seq.value.id))
      function nextSequence() {
        cur = (cur + 1) % result.sequences.length
        seq.value = result.sequences[cur]
        feat.value = result.features.filter((x) => x.sequence === seq.value.id)
      }
      return { seq, feat, nextSequence, args }
    },
    template:
      '<button @click="nextSequence">Toggle</button><BaktaCircularPlot v-bind="args" :sequence="seq" :features="feat" />',
  }),
}

export const FeatureAcrossOrigin: Story = {
  args: {
    sequence: { complete: true, id: 'x', length: 10, nt: 'aaaaaaaaaa', type: '' },
    features: [
      {
        id: 'fwd_crossing',
        sequence: 'x',
        start: 9,
        stop: 11,
        strand: '+',
        type: 'cds',
        db_xrefs: [],
        gene: null,
        product: null,
        locus: 'abc',
      },
      {
        id: 'fwd',
        sequence: 'x',
        start: 4,
        stop: 5,
        strand: '+',
        type: 'cds',
        db_xrefs: [],
        gene: null,
        product: null,
        locus: 'abc',
      },
      {
        id: 'rev_crossing',
        sequence: 'x',
        start: 9,
        stop: 11,
        strand: '-',
        type: 'cds',
        db_xrefs: [],
        gene: null,
        product: null,
        locus: 'abc',
      },

      {
        id: 'rev',
        sequence: 'x',
        start: 5,
        stop: 3,
        strand: '-',
        type: 'cds',
        db_xrefs: [],
        gene: null,
        product: null,
        locus: 'abc',
      },
    ],
  },
}
