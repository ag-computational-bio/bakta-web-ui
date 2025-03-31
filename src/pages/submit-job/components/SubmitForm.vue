<template>
  <div class="alert alert-secondary">
    This service is open to everyone and can be used free of charge. For more details
    <RouterLink to="/about">click here</RouterLink>
  </div>
  <div class="mb-3">
    <FastaSequenceInput
      v-if="seqSource == 'none' || seqSource == 'text'"
      ref="fastaSequenceInput"
      @update:sequences="(evt) => updateParsedSequence('text', evt)"
    />
    <div v-if="seqSource === 'none' && loadingExample == undefined" class="mb-2">
      <span class="ms-1 text-sm text-secondary">Use example sequence: </span>
      <button
        v-if="seqSource === 'none'"
        class="btn btn-sm border-0 py-0 text-sm btn-outline-secondary"
        @click="(e) => loadExampleData(e, 'plasmid')"
      >
        Plasmid
      </button>
      <button
        v-if="seqSource === 'none'"
        class="btn btn-sm border-0 py-0 text-sm btn-outline-secondary"
        @click="(e) => loadExampleData(e, 'complete')"
      >
        Genome
      </button>
    </div>
    <ProgressBar
      v-if="loadingExample"
      class="mt-2"
      :progress="loadingExample"
      :show-label="false"
    />
    <FastaFileChooser
      v-if="(seqSource == 'none' && loadingExample == undefined) || seqSource == 'file'"
      ref="fastaFileInput"
      :class="seqSource == 'none' ? 'mt-1' : ''"
      @update:sequences="(evt) => updateParsedSequence('file', evt)"
    />
    <Notification
      class="mt-2"
      v-if="validationError.length > 0"
      :message="validationError"
      type="warning"
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
import Notification from '@/components/Notification.vue'
import { parseFasta, type Seq, type SequenceInput } from '@/fasta/parse-fasta'
import { validateDna } from '@/fasta/validate-fasta'
import { createBaktaJobRequest, type BaktaJobRequest, type Replicon } from '@/model/bakta-service'
import type { JobConfig } from '@/model/submit'
import { computed, ref, useTemplateRef, watch } from 'vue'
import AutocompleteInput from './AutocompleteInput.vue'
import EditRepliconTable from './EditRepliconTable.vue'
import FastaFileChooser from './FastaFileChooser.vue'
import FastaSequenceInput from './FastaSequenceInput.vue'
import LocusInput from './LocusInput.vue'
import LocusTagInput from './LocusTagInput.vue'
import SelectDermType from './SelectDermType.vue'
import SelectTranslationTable from './SelectTranslationTable.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { useProgress, type Progress } from '@/components/progress'
import notifyFetchProgress from '@/notify-fetch-progress'

const props = defineProps<{
  modelValue: BaktaJobRequest
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: BaktaJobRequest): void
  (e: 'update:valid', v: boolean): void
}>()

type SequenceSource = 'none' | 'text' | 'file'

const seqSource = ref<SequenceSource>('none')
const sequenceSelected = computed(() => seqSource.value != 'none')
const parsed = ref<Seq[]>([])
const validationError = ref<string[]>([])
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
  set: (v) => {
    let possibleTopologies = []
    let possibleTypes = []
    let newTopology = null
    let newType = null

    if (v) {
      possibleTypes = ['chromosome', 'plasmid']
      possibleTopologies = ['c']
      newTopology = 'c'
      newType = 'chromosome'
    } else {
      possibleTypes = ['contig']
      possibleTopologies = ['l']
      newTopology = 'l'
      newType = 'contig'
    }

    const repliconsUpdate: Replicon[] = []

    for (const oldReplicon of replicons.value) {
      const copy = { ...oldReplicon }
      if (!possibleTypes.some((y) => oldReplicon.type === y)) copy.type = newType
      if (!possibleTopologies.some((y) => oldReplicon.topology === y)) copy.topology = newTopology
      repliconsUpdate.push(copy)
    }

    updateRequest({ replicons: repliconsUpdate, config: { ...config.value, completeGenome: v } })
  },
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

const genus_species = ref<string>('')
watch(
  () => genus_species.value,
  (v) => {
    const split = v.indexOf(' ')
    if (split >= 0) {
      updateConfig({ genus: v.substring(0, split), species: v.substring(split + 1) })
    } else {
      updateConfig({ genus: v, species: '' })
    }
  },
)

const replicons = computed({
  get: () => props.modelValue.replicons,
  set: (v) => updateRequest({ replicons: v }),
})

const idsAreINSDCCompliant = computed(() => {
  const insdecRe = /^[A-Za-z\d_.:*#-]{1,25}$/
  for (const x of replicons.value) {
    const id = x.new.length > 0 ? x.new : x.id
    if (!insdecRe.exec(id)) {
      return false
    }
  }
  return true
})

const valid = computed(() => {
  const emptySequence = props.modelValue.sequence.length == 0
  if (keepContigHeaders.value || compliant.value) return idsAreINSDCCompliant.value
  return !emptySequence
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
function validateSequences(seqs: Seq[]) {
  const messages = []
  const dna = validateDna(seqs)
  if (!dna.valid) messages.push(...dna.messages)
  for (const s of seqs) {
    if (s.sequence.length < 1) messages.push(`The sequence ${s.id} has no content`)
  }
  validationError.value = messages
  emit('update:valid', messages.length == 0)
}

function updateParsedSequence(source: SequenceSource, s: SequenceInput) {
  parsed.value = s.parsed
  validationError.value = []
  if (s.parsed.length == 0) {
    seqSource.value = 'none'
    parsed.value = []
    emit('update:valid', false)
    updateRequest({ sequence: '', replicons: [], jobName: '' })
  } else {
    validateSequences(s.parsed)

    seqSource.value = source
    const replicons: Replicon[] = []
    for (const seq of s.parsed) {
      replicons.push({
        id: seq.id,
        new: '',
        length: seq.sequence.length,
        name: '',
        topology: 'l',
        type: 'contig',
      })
    }

    updateRequest({ sequence: s.sequence, replicons: replicons, jobName: s.name })
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
      return j.map((x: EbiTaxonomySuggestion) => x.scientificName)
    })
}

const fastaSequenceInput = useTemplateRef('fastaSequenceInput')
const fastaFileInput = useTemplateRef('fastaFileInput')
function reset() {
  parsed.value = []
  fastaSequenceInput.value?.reset()
  fastaFileInput.value?.reset()
  seqSource.value = 'none'
  emit('update:modelValue', createBaktaJobRequest())
}

const examples = {
  plasmid: '/NC_002127.1.fna.gz',
  complete: '/GCF_000008865.2.fna.gz',
}
const loadingExample = ref<Progress>()
function loadExampleData(evt: Event, type: 'plasmid' | 'complete') {
  evt.preventDefault()
  const { progress } = useProgress({
    min: 0,
    max: 1,
    value: 1,
    type: 'indeterminate',
    title: 'Loading example data',
  })
  loadingExample.value = progress
  fetch(examples[type])
    .then((response) =>
      notifyFetchProgress(
        response,
        () => {},
        () => {
          if (loadingExample.value) {
            loadingExample.value.title = 'Processing data. This may take a while.'
            loadingExample.value.type = 'indeterminate'
          }
        },
      ),
    )
    .then((stream) => new Response(stream))
    .then((r) => r.text())
    .then((t) => {
      fastaSequenceInput.value?.set(t)
      updateParsedSequence('text', {
        name: examples[type].substring(1),
        parsed: parseFasta(t),
        sequence: t,
      })
      loadingExample.value = undefined
    })
    .catch((err) => {
      console.warn(err)
      loadingExample.value = undefined
    })
}
</script>
<style>
.text-sm {
  font-size: 0.85rem;
}
</style>
