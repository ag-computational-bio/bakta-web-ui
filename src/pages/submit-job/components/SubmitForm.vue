<template>
  <div class="mt-4">
    <div class="border rounded-3 p-4">
      <h4 class="mb-2">Genome input</h4>
      <p class="text-secondary mb-3">
        Paste a FASTA sequence, load an example, or upload a FASTA file.
      </p>
      <FastaSequenceInput
        v-if="seqSource === 'none' || seqSource === 'text'"
        ref="fastaSequenceInput"
        @update:sequences="(evt) => updateParsedSequence('text', evt)"
      />
      <div v-if="seqSource === 'none' && loadingExample == undefined" class="mb-2 mt-2">
        <span class="text-sm text-secondary">Use example sequence: </span>
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
      <div
        v-if="(seqSource === 'none' && loadingExample == undefined) || seqSource === 'file'"
        class="mt-3"
      >
        <label class="form-label" for="fastaFile">FASTA file</label>
        <FastaFileChooser
          ref="fastaFileInput"
          @update:sequences="(evt) => updateParsedSequence('file', evt)"
        />
      </div>
      <Notification
        v-if="validationError.length > 0"
        class="mt-2"
        :message="validationError"
        type="warning"
      />
    </div>
  </div>
  <div v-if="seqSource !== 'none'" class="d-flex justify-content-end mt-3">
    <button class="btn btn-secondary" @click="reset">Reset</button>
  </div>

  <div v-if="sequenceSelected">
    <hr />
    <div class="mt-4">
      <h4 class="mb-2">Organism</h4>
      <div class="row g-3">
        <div class="col-md-6">
          <AutocompleteInput
            v-model="genusSpecies"
            :lookupFn="lookupGenusSpecies"
            placeholder="Genus and species (optional)"
          />
        </div>
        <div class="col-md-6">
          <input
            id="strain"
            v-model="strain"
            class="form-control"
            type="text"
            placeholder="Strain (optional)"
          />
        </div>
        <div class="col-md-6">
          <LocusInput v-model="locus" />
        </div>
        <div class="col-md-6">
          <LocusTagInput v-model="locusTag" :compliant="compliant" />
        </div>
      </div>
    </div>

    <div class="mt-4">
      <h4 class="mb-2">Annotation</h4>
      <div class="row g-3 align-items-start">
        <div class="col-lg-4">
          <div class="form-check mt-1">
            <input
              id="complete-genome"
              v-model="completeGenome"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="complete-genome">Complete genome</label>
          </div>
          <div class="form-check">
            <input
              id="keep-headers"
              v-model="keepContigHeaders"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="keep-headers">Keep contig headers</label>
          </div>
          <div class="form-check">
            <input id="compliant" v-model="compliant" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="compliant">INSDC compliant output</label>
          </div>
          <div v-if="showBaktfoldAfter" class="form-check">
            <input
              id="run-baktfold-after"
              v-model="runBaktfoldAfter"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="run-baktfold-after">
              Run Baktfold
              <i
                class="bi bi-question-circle text-secondary ms-1"
                role="img"
                aria-label="Info"
                title="Annotate remaining hypothetical genes using protein structural annotation"
              ></i>
            </label>
          </div>
        </div>
        <div class="col-md-4 col-lg-3">
          <label class="form-label" for="min-contig-length">Min contig length</label>
          <input
            id="min-contig-length"
            v-model.number="minContigLength"
            class="form-control"
            type="number"
          />
        </div>
        <div class="col-md-4 col-lg-3">
          <label class="form-label" for="translation-table">Translation table</label>
          <SelectTranslationTable id="translation-table" v-model="translationTable" />
        </div>
        <div class="col-md-4 col-lg-2">
          <label class="form-label" for="mono-diderm">
            Mono-/Diderm
            <i
              class="bi bi-question-circle text-secondary ms-1"
              role="img"
              aria-label="Info"
              title="Maps to Bakta --gram parameter"
            ></i>
          </label>
          <SelectDermType id="mono-diderm" v-model="dermType" />
        </div>
      </div>

      <details class="mt-4 advanced-options">
        <summary
          class="text-secondary fw-semibold d-flex align-items-center justify-content-between"
        >
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-chevron-right advanced-chevron"></i>
            Advanced options
          </span>
          <span></span>
        </summary>
        <div class="row g-3 mt-2">
          <div class="col-md-6 col-xl-4">
            <div class="border rounded-3 p-3 h-100">
              <div class="form-check mb-0">
                <input id="meta" v-model="meta" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="meta">Metagenome mode</label>
              </div>
              <div class="small text-secondary mt-2">
                Relaxes assumptions for fragmented or mixed assemblies.
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-4">
            <div class="border rounded-3 p-3 h-100">
              <label class="form-label mb-1" for="plasmid">Plasmid</label>
              <input
                id="plasmid"
                v-model="plasmid"
                class="form-control"
                type="text"
                placeholder="Plasmid name (optional)"
              />
            </div>
          </div>
          <div class="col-md-6 col-xl-4">
            <div class="border rounded-3 p-3 h-100">
              <label class="form-label mb-1" for="locus-tag-increment">Locus tag increment</label>
              <select
                id="locus-tag-increment"
                v-model.number="locusTagIncrement"
                class="form-select"
              >
                <option v-for="item in locusTagIncrementOptions" :key="item" :value="item">
                  {{ item }}
                </option>
              </select>
            </div>
          </div>

          <div class="col-12">
            <div class="border rounded-3 p-3">
              <div class="mb-3">
                <h5 class="mb-0">Additional evidence files</h5>
                <div class="small text-secondary">Only applied when a file is provided.</div>
              </div>
              <div class="row g-3">
                <div class="col-md-6 col-xl-3">
                  <label class="form-label" for="trusted-proteins-file">Trusted proteins</label>
                  <input
                    id="trusted-proteins-file"
                    class="form-control"
                    type="file"
                    accept=".faa,.fa,.fasta"
                    @change="(evt) => updateFile('trustedProteinsFile', evt)"
                  />
                  <div
                    v-if="modelValue.trustedProteinsFile"
                    class="small text-secondary mt-1 text-truncate"
                  >
                    {{ modelValue.trustedProteinsFile.name }}
                  </div>
                </div>
                <div class="col-md-6 col-xl-3">
                  <label class="form-label" for="hmms-file">HMMs file</label>
                  <input
                    id="hmms-file"
                    class="form-control"
                    type="file"
                    accept=".hmm"
                    @change="(evt) => updateFile('hmmsFile', evt)"
                  />
                  <div v-if="modelValue.hmmsFile" class="small text-secondary mt-1 text-truncate">
                    {{ modelValue.hmmsFile.name }}
                  </div>
                </div>
                <div class="col-md-6 col-xl-3">
                  <label class="form-label" for="regions-file">Regions file</label>
                  <input
                    id="regions-file"
                    class="form-control"
                    type="file"
                    @change="(evt) => updateFile('regionsFile', evt)"
                  />
                  <div
                    v-if="modelValue.regionsFile"
                    class="small text-secondary mt-1 text-truncate"
                  >
                    {{ modelValue.regionsFile.name }}
                  </div>
                </div>
                <div class="col-md-6 col-xl-3">
                  <label class="form-label" for="prodigal-training-file"
                    >Prodigal training file</label
                  >
                  <input
                    id="prodigal-training-file"
                    class="form-control"
                    type="file"
                    accept=".tf"
                    @change="(evt) => updateFile('prodigalTrainingFile', evt)"
                  />
                  <div
                    v-if="modelValue.prodigalTrainingFile"
                    class="small text-secondary mt-1 text-truncate"
                  >
                    {{ modelValue.prodigalTrainingFile.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="border rounded-3 p-3">
              <h5 class="mb-0">Skip features</h5>
              <div class="small text-secondary mb-3">
                Select annotations you want Bakta to skip.
              </div>
              <div class="row g-2">
                <div class="col-sm-6 col-lg-4" v-for="option in skipOptions" :key="option.key">
                  <label class="skip-option" :for="option.key">
                    <input
                      :id="option.key"
                      :checked="skipOptionValue(option.key)"
                      class="form-check-input mt-0"
                      type="checkbox"
                      @change="(evt) => updateSkipOption(option.key, evt)"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>

      <div class="mt-4">
        <h4 class="mb-2">Replicons</h4>
        <div class="row scroll">
          <EditRepliconTable v-model="replicons" :completeGenome="completeGenome" />
        </div>
      </div>
      <div v-if="!valid && !idsAreINSDCCompliant" class="row mt-3">
        <div class="col">
          <div class="alert alert-danger mb-0">The contig ids are not INSDC compliant.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { useProgress, type Progress } from '@/components/progress'
import ProgressBar from '@/components/ProgressBar.vue'
import { parseFasta, type Seq, type SequenceInput } from '@/fasta/parse-fasta'
import { validateDna } from '@/fasta/validate-fasta'
import { createBaktaJobRequest, type BaktaJobRequest, type Replicon } from '@/model/bakta-service'
import type { JobConfig } from '@/model/submit'
import notifyFetchProgress from '@/notify-fetch-progress'
import { computed, ref, useTemplateRef, watch } from 'vue'
import AutocompleteInput from './AutocompleteInput.vue'
import EditRepliconTable from './EditRepliconTable.vue'
import FastaFileChooser from './FastaFileChooser.vue'
import FastaSequenceInput from './FastaSequenceInput.vue'
import LocusInput from './LocusInput.vue'
import LocusTagInput from './LocusTagInput.vue'
import SelectDermType from './SelectDermType.vue'
import SelectTranslationTable from './SelectTranslationTable.vue'

const props = withDefaults(
  defineProps<{
    modelValue: BaktaJobRequest
    showBaktfoldAfter?: boolean
  }>(),
  {
    showBaktfoldAfter: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: BaktaJobRequest): void
  (e: 'update:valid', v: boolean): void
}>()

type SequenceSource = 'none' | 'text' | 'file'
type BaktaFileField = 'prodigalTrainingFile' | 'regionsFile' | 'trustedProteinsFile' | 'hmmsFile'
type SkipOptionKey =
  | 'skipTrna'
  | 'skipTmrna'
  | 'skipRrna'
  | 'skipNcrna'
  | 'skipNcrnaRegion'
  | 'skipCrispr'
  | 'skipCds'
  | 'skipPseudo'
  | 'skipSorf'
  | 'skipGap'
  | 'skipOri'
  | 'skipFilter'
  | 'skipPlot'

const seqSource = ref<SequenceSource>('none')
const sequenceSelected = computed(() => seqSource.value !== 'none')
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

const plasmid = computed({
  get: () => config.value.plasmid,
  set: (v) => updateConfig({ plasmid: v }),
})

const locus = computed({
  get: () => config.value.locus,
  set: (v) => updateConfig({ locus: v }),
})

const locusTag = computed({
  get: () => config.value.locusTag,
  set: (v) => updateConfig({ locusTag: v }),
})

const locusTagIncrementOptions = [1, 5, 10]
const locusTagIncrement = computed({
  get: () => config.value.locusTagIncrement,
  set: (v) => updateConfig({ locusTagIncrement: v }),
})

const completeGenome = computed({
  get: () => config.value.completeGenome,
  set: (v) => {
    const possibleTypes = v ? ['chromosome', 'plasmid'] : ['contig']
    const possibleTopologies = v ? ['c'] : ['l']
    const newTopology = v ? 'c' : 'l'
    const newType = v ? 'chromosome' : 'contig'

    const repliconsUpdate: Replicon[] = []
    for (const oldReplicon of replicons.value) {
      const copy = { ...oldReplicon }
      if (!possibleTypes.some((type) => oldReplicon.type === type)) copy.type = newType
      if (!possibleTopologies.some((topology) => oldReplicon.topology === topology)) {
        copy.topology = newTopology
      }
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

const meta = computed({
  get: () => config.value.meta,
  set: (v) => updateConfig({ meta: v }),
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

const runBaktfoldAfter = computed({
  get: () => props.modelValue.workflowKind === 'bakta_baktfold',
  set: (enabled) => updateRequest({ workflowKind: enabled ? 'bakta_baktfold' : 'bakta' }),
})

const genusSpecies = ref<string>('')
watch(
  () => genusSpecies.value,
  (value) => {
    const split = value.indexOf(' ')
    if (split >= 0) {
      updateConfig({ genus: value.substring(0, split), species: value.substring(split + 1) })
    } else {
      updateConfig({ genus: value, species: '' })
    }
  },
)

const replicons = computed({
  get: () => props.modelValue.replicons,
  set: (v) => updateRequest({ replicons: v }),
})

const idsAreINSDCCompliant = computed(() => {
  const insdecRe = /^[A-Za-z\d_.:*#-]{1,25}$/
  for (const replicon of replicons.value) {
    const id = replicon.new.length > 0 ? replicon.new : replicon.id
    if (!insdecRe.exec(id)) return false
  }
  return true
})

const valid = computed(() => {
  if (props.modelValue.sequence.length === 0) return false
  if (validationError.value.length > 0) return false
  if (keepContigHeaders.value || compliant.value) return idsAreINSDCCompliant.value
  return true
})

watch(
  () => valid.value,
  (value) => emit('update:valid', value),
  { immediate: true },
)

function updateFile(field: BaktaFileField, evt: Event) {
  if (!(evt.target instanceof HTMLInputElement)) return
  const files = evt.target.files
  updateRequest({ [field]: files == null || files.length === 0 ? null : files.item(0) } as Pick<
    BaktaJobRequest,
    BaktaFileField
  >)
}

function validateSequences(seqs: Seq[]) {
  const messages = []
  const dna = validateDna(seqs)
  if (!dna.valid) messages.push(...dna.messages)
  for (const sequence of seqs) {
    if (sequence.sequence.length < 1) messages.push(`The sequence ${sequence.id} has no content`)
  }
  validationError.value = messages
}

function updateParsedSequence(source: SequenceSource, input: SequenceInput) {
  parsed.value = input.parsed
  validationError.value = []
  if (input.parsed.length === 0) {
    seqSource.value = 'none'
    parsed.value = []
    updateRequest({ sequence: '', replicons: [], jobName: '' })
    return
  }

  validateSequences(input.parsed)
  seqSource.value = source
  const updatedReplicons: Replicon[] = input.parsed.map((sequence) => ({
    id: sequence.id,
    new: '',
    length: sequence.sequence.length,
    name: '',
    topology: 'l',
    type: 'contig',
  }))

  updateRequest({ sequence: input.sequence, replicons: updatedReplicons, jobName: input.name })
}

type EbiTaxonomySuggestion = {
  scientificName: string
}

function lookupGenusSpecies(n: string) {
  return window
    .fetch('https://www.ebi.ac.uk/ena/taxonomy/rest/suggest-for-search/' + n)
    .then((r) => r.json())
    .then((j) => j.map((x: EbiTaxonomySuggestion) => x.scientificName))
}

const fastaSequenceInput = useTemplateRef('fastaSequenceInput')
const fastaFileInput = useTemplateRef('fastaFileInput')

function reset() {
  parsed.value = []
  validationError.value = []
  fastaSequenceInput.value?.reset()
  fastaFileInput.value?.reset()
  seqSource.value = 'none'
  emit('update:modelValue', createBaktaJobRequest())
}

const examples = {
  plasmid: '/NC_002127.1.fna.gz',
  complete: '/GCF_000008865.2.fna.gz',
} as const

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
    .then((text) => {
      fastaSequenceInput.value?.set(text)
      updateParsedSequence('text', {
        name: examples[type].substring(1),
        parsed: parseFasta(text),
        sequence: text,
      })
      loadingExample.value = undefined
    })
    .catch((err) => {
      console.warn(err)
      loadingExample.value = undefined
    })
}

const skipOptions: { key: SkipOptionKey; label: string }[] = [
  { key: 'skipTrna', label: 'Skip tRNA' },
  { key: 'skipTmrna', label: 'Skip tmRNA' },
  { key: 'skipRrna', label: 'Skip rRNA' },
  { key: 'skipNcrna', label: 'Skip ncRNA' },
  { key: 'skipNcrnaRegion', label: 'Skip ncRNA region' },
  { key: 'skipCrispr', label: 'Skip CRISPR' },
  { key: 'skipCds', label: 'Skip CDS' },
  { key: 'skipPseudo', label: 'Skip pseudogenes' },
  { key: 'skipSorf', label: 'Skip sORFs' },
  { key: 'skipGap', label: 'Skip gaps' },
  { key: 'skipOri', label: 'Skip ori' },
  { key: 'skipFilter', label: 'Skip filters' },
  { key: 'skipPlot', label: 'Skip circular plot' },
]

function skipOptionValue(key: SkipOptionKey): boolean {
  return config.value[key]
}

function updateSkipOption(key: SkipOptionKey, evt: Event) {
  if (evt.target instanceof HTMLInputElement)
    updateConfig({ [key]: evt.target.checked } as Pick<JobConfig, SkipOptionKey>)
}
</script>

<style scoped>
.advanced-options > summary {
  list-style: none;
  cursor: pointer;
  padding: 0.5rem 0;
}

.advanced-options > summary::-webkit-details-marker,
.advanced-chevron {
  transition: transform 0.2s ease;
  font-size: 0.85em;
}

.advanced-options[open] > summary .advanced-chevron {
  transform: rotate(90deg);
}

.skip-option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  background: var(--bs-body-bg);
}

.skip-option:hover {
  border-color: var(--bs-secondary-color);
}
</style>
