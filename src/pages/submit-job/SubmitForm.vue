<template>
  <div class="mb-3">
    <FastaSequenceInput
      v-if="seqSource == 'none' || seqSource == 'text'"
      ref="fastaSequenceInput"
      @update:sequence="updateSequence"
      @update:sequences="(evt) => updateParsedSequence('text', evt)"
    />
    <FastaFileChooser
      v-if="seqSource == 'none' || seqSource == 'file'"
      ref="fastaFileInput"
      :class="seqSource == 'none' ? 'mt-3' : ''"
      @update:sequence="updateSequence"
      @update:sequences="(evt) => updateParsedSequence('file', evt)"
    />
  </div>
  <div v-if="seqSource != 'none'" class="d-flex justify-content-end">
    <button @click="reset" class="btn btn-secondary">Reset</button>
  </div>

  <div v-if="sequenceSelected">
    <hr />
    <div class="mt-4">
      <h4 class="mb-2">Organism</h4>
      <div class="row">
        <div class="col">
          <AutocompleteInput
            v-model="genus_species"
            :lookupFn="lookupGenusSpecies"
            placeholder="Genus and species (optional)"
          />
        </div>

        <div class="col">
          <input
            class="form-control"
            type="text"
            id="strain"
            placeholder="Strain (optional)"
            v-model="strain"
          />
        </div>
      </div>
      <div class="row mt-2">
        <div class="col">
          <LocusInput v-model="locus" />
        </div>
        <div class="col">
          <LocusTagInput v-model="locus_tag" :compliant="compliant" />
        </div>
      </div>
    </div>

    <div class="mt-4">
      <h4 class="mb-2">Annotation</h4>
      <div class="row">
        <div class="col">
          <div class="form-check mt-3">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="completeGenome"
              id="complete-genome"
            />
            <label class="form-check-label" for="complete-genome"> Complete genome </label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="keepContigHeaders"
              id="keep-headers"
            />
            <label class="form-check-label" for="keep-headers"> Keep contig headers </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" v-model="compliant" id="compliant" />
            <label class="form-check-label" for="compliant"> INSDC compliant output </label>
          </div>
        </div>
        <div class="col">
          <label class="form-label" for="min-contig-length"> Min contig length </label>
          <input
            class="form-control"
            type="number"
            v-model="minContigLength"
            id="min-contig-length"
          />
        </div>
        <div class="col">
          <label class="form-label" for="translation-table"> Translation table </label>
          <SelectTranslationTable id="translation-table" v-model="translationTable" />
        </div>
        <div class="col">
          <label class="form-label" for="mono-diderm">Mono-/Diderm</label>
          <SelectDermType id="mono-diderm" v-model="dermType" />
        </div>
        <div class="col">
          <label class="form-label" for="prodigal-training-file"> Prodigal training file </label>

          <input
            class="form-control"
            type="file"
            id="prodigal-training-file"
            @change="updateProdigalFile"
            accept=".tf"
          />
        </div>
      </div>
      <div class="mt-4">
        <h4 class="mb-2">Replicons</h4>
        <div class="row scroll">
          <EditRepliconTable v-model="replicons" :completeGenome="completeGenome" />
        </div>
      </div>
      <div class="row" v-if="!valid && !idsAreINSDCCompliant">
        <div class="col">
          <div class="alert alert-danger">The contig ids are not INSDC compliant.</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Seq } from '@/fasta/parse-fasta'
import { createBaktaJobRequest, type BaktaJobRequest, type Replicon } from '@/model/bakta-service'
import type { JobConfig } from '@/model/submit'
import { computed, ref, useTemplateRef } from 'vue'
import AutocompleteInput from './AutocompleteInput.vue'
import EditRepliconTable from './EditRepliconTable.vue'
import FastaFileChooser from './FastaFileChooser.vue'
import FastaSequenceInput from './FastaSequenceInput.vue'
import LocusInput from './LocusInput.vue'
import LocusTagInput from './LocusTagInput.vue'
import SelectDermType from './SelectDermType.vue'
import SelectTranslationTable from './SelectTranslationTable.vue'

const props = defineProps<{
  modelValue: BaktaJobRequest
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: BaktaJobRequest): void
}>()

type SequenceSource = 'none' | 'text' | 'file'

const seqSource = ref<SequenceSource>('none')
const sequenceSelected = computed(() => seqSource.value != 'none')

const config = computed(() => props.modelValue.config)

function updateConfig(update: Partial<JobConfig>) {
  updateRequest({ config: { ...config.value, ...update } })
}
function updateRequest(update: Partial<BaktaJobRequest>) {
  emit('update:modelValue', { ...props.modelValue, ...update })
}
const strain = computed({
  get: () => config.value.strain,
  set: (v) => updateConfig({ strain: v }),
})
const locus = computed({
  get: () => config.value.locus,
  set: (v) => updateConfig({ locus: v }),
})
const locus_tag = computed({
  get: () => config.value.locusTag,
  set: (v) => updateConfig({ locusTag: v }),
})
const completeGenome = computed({
  get: () => config.value.completeGenome,
  set: (v) => updateConfig({ completeGenome: v }),
})
const keepContigHeaders = computed({
  get: () => config.value.keepContigHeaders,
  set: (v) => updateConfig({ keepContigHeaders: v }),
})
const compliant = computed({
  get: () => config.value.compliant,
  set: (v) => updateConfig({ compliant: v }),
})
const minContigLength = computed({
  get: () => config.value.minContigLength,
  set: (v) => updateConfig({ minContigLength: v }),
})
const translationTable = computed({
  get: () => config.value.translationTable,
  set: (v) => updateConfig({ translationTable: v }),
})
const dermType = computed({
  get: () => config.value.dermType,
  set: (v) => updateConfig({ dermType: v }),
})
const genus_species = computed({
  get: () =>
    [config.value.genus, config.value.species].filter((x) => x != null && x.length > 0).join(' '),
  set: (v) => {
    const split = v.indexOf(' ')
    if (split >= 0) {
      updateConfig({ genus: v.substring(0, split), species: v.substring(split + 1) })
    } else {
      updateConfig({ genus: v, species: '' })
    }
  },
})

const replicons = computed({
  get: () => props.modelValue.replicons,
  set: (v) => updateRequest({ replicons: v }),
})

const idsAreINSDCCompliant = computed(() => {
  const insdecRe = /^[A-Za-z\d_.:*#-]{1,25}$/
  for (const x of replicons.value) {
    const id = x.new ?? x.id
    if (!insdecRe.exec(id)) {
      return false
    }
  }
  return true
})

const valid = computed(() => {
  // return true
  const emptySequence = props.modelValue.sequence.length == 0
  if (keepContigHeaders.value || compliant.value) return idsAreINSDCCompliant.value
  return emptySequence
})

function updateProdigalFile(evt: Event) {
  if (evt.target instanceof HTMLInputElement) {
    const files = evt.target.files
    if (files == null || files.length == 0) {
      updateRequest({ prodigalTrainingFile: undefined })
    } else {
      updateRequest({ prodigalTrainingFile: files.item(0) })
    }
  }
}
function updateSequence(s: string) {
  updateRequest({ sequence: s })
}
function updateParsedSequence(source: SequenceSource, s: Seq[]) {
  if (s.length == 0) {
    seqSource.value = 'none'
    updateRequest({ replicons: [] })
  } else {
    seqSource.value = source
    const replicons: Replicon[] = []
    for (const seq of s) {
      replicons.push({
        id: seq.id,
        new: '',
        length: seq.sequence.length,
        name: '',
        topology: 'linear',
        type: 'contig',
      })
    }
    updateRequest({ replicons: replicons })
  }
}

type EbiTaxonomySuggestion = {
  scientificName: string
}

function lookupGenusSpecies(n: string) {
  return window
    .fetch('https://www.ebi.ac.uk/ena/taxonomy/rest/suggest-for-search/' + n)
    .then((r) => r.json())
    .then((j) => {
      console.log(j)
      return j.map((x: EbiTaxonomySuggestion) => x.scientificName)
    })
}

const fastaSequenceInput = useTemplateRef('fastaSequenceInput')
const fastaFileInput = useTemplateRef('fastaFileInput')
function reset() {
  fastaSequenceInput.value?.reset()
  fastaFileInput.value?.reset()
  seqSource.value = 'none'
  emit('update:modelValue', createBaktaJobRequest())
}
</script>
