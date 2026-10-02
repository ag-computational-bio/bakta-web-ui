<template>
  <div class="mt-4">
    <div class="card p-4">
      <div class="d-flex justify-content-between align-items-start">
        <h2 class="section-title">Genome input</h2>
        <button
          v-if="seqSource !== 'none'"
          class="btn btn-outline-secondary btn-sm"
          type="button"
          @click="reset"
        >
          <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
        </button>
      </div>
      <p class="text-secondary mb-3">
        Paste a FASTA sequence, load an example, or upload a FASTA file.
      </p>
      <FastaSequenceInput
        v-if="seqSource === 'none' || seqSource === 'text'"
        ref="fastaSequenceInput"
        @update:sequences="(evt) => updateParsedSequence('text', evt)"
      />
      <div v-if="seqSource === 'none' && loadingExample == undefined" class="mb-2 mt-2">
        <span class="small text-secondary">Use example sequence: </span>
        <button
          v-if="seqSource === 'none'"
          class="btn btn-link btn-sm py-0 px-1"
          @click="(e) => loadExampleData(e, 'plasmid')"
        >
          Plasmid
        </button>
        <button
          v-if="seqSource === 'none'"
          class="btn btn-link btn-sm py-0 px-1"
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

  <div v-if="sequenceSelected">
    <div class="card p-4 mt-4">
      <h2 class="section-title">Annotation</h2>
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
            <HelpTip
              class="ms-1"
              text="All sequences are complete replicons. Each sequence then needs a type and topology."
            />
          </div>
          <div class="form-check">
            <input
              id="keep-headers"
              v-model="keepContigHeaders"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="keep-headers">Keep contig headers</label>
            <HelpTip
              class="ms-1"
              text="Keep the original sequence headers instead of renaming them."
            />
          </div>
          <div class="form-check">
            <input id="compliant" v-model="compliant" class="form-check-input" type="checkbox" />
            <label class="form-check-label" for="compliant">INSDC compliant output</label>
            <HelpTip
              class="ms-1"
              text="Force GenBank/ENA/DDBJ compliance. Sequence IDs must then be valid INSDC IDs."
            />
          </div>
          <div v-if="showBaktfoldAfter" class="form-check baktfold-option">
            <input
              id="run-baktfold-after"
              v-model="runBaktfoldAfter"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label fw-semibold" for="run-baktfold-after">
              Run Baktfold
            </label>
            <span class="badge rounded-pill text-bg-primary ms-1 align-text-top">New</span>
            <HelpTip
              class="ms-1"
              text="Annotate remaining hypothetical genes using protein structural annotation."
            />
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
          <label class="form-label me-1" for="translation-table">Translation table</label>
          <HelpTip
            text="Genetic code used for translation. Table 11 fits most bacteria and archaea."
          />
          <SelectTranslationTable id="translation-table" v-model="translationTable" />
        </div>
        <div class="col-md-4 col-lg-2">
          <label class="form-label me-1" for="mono-diderm">Mono-/Diderm</label>
          <HelpTip
            text="Gram type for signal peptide prediction: monoderm is Gram-positive, diderm is Gram-negative."
          />
          <SelectDermType id="mono-diderm" v-model="dermType" />
        </div>
      </div>
    </div>

    <div class="card p-4 mt-4">
      <h2 class="section-title">
        Replicons
        <HelpTip
          class="fs-6 align-middle"
          text="Optionally give a sequence a new ID or name and set its type and topology. Empty fields keep the original values."
        />
      </h2>
      <div class="table-responsive">
        <EditRepliconTable v-model="replicons" :completeGenome="completeGenome" />
      </div>
      <div v-if="!valid && !idsAreINSDCCompliant" class="alert alert-danger mb-0 mt-3">
        The contig ids are not INSDC compliant.
      </div>
    </div>

    <div class="card p-4 mt-4">
      <h2 class="section-title">
        Organism <small class="fs-6 fw-normal text-secondary">optional</small>
      </h2>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label me-1" for="genus-species">Genus and species</label>
          <HelpTip text="Suggestions come from the ENA taxonomy." />
          <AutocompleteInput
            v-model="genusSpecies"
            input-id="genus-species"
            :lookupFn="lookupGenusSpecies"
            placeholder="e.g. Escherichia coli"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label" for="strain">Strain</label>
          <input
            id="strain"
            v-model="strain"
            class="form-control"
            type="text"
            placeholder="e.g. Sakai"
          />
        </div>
        <div class="col-md-6">
          <label class="form-label me-1" for="locus">Locus prefix</label>
          <HelpTip
            text="Prefix for sequence IDs (default: contig). Up to 20 characters: letters, digits and _ - * . #"
          />
          <LocusInput v-model="locus" />
        </div>
        <div class="col-md-6">
          <label class="form-label me-1" for="locustag">Locus tag prefix</label>
          <HelpTip
            text="Prefix for feature IDs. Created automatically if empty. 3 to 12 characters: uppercase letters and digits, starting with a letter."
          />
          <LocusTagInput v-model="locusTag" :compliant="compliant" />
        </div>
      </div>
    </div>

    <div class="card px-4 py-3 mt-4">
      <details class="advanced-options">
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
            <div class="rounded-3 p-3 bg-body-tertiary h-100">
              <div class="form-check mb-0">
                <input id="meta" v-model="meta" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="meta">Metagenome mode</label>
                <HelpTip
                  class="ms-1"
                  text="Run in metagenome mode. This only affects CDS prediction."
                />
              </div>
            </div>
          </div>
          <div class="col-md-6 col-xl-4">
            <div class="rounded-3 p-3 bg-body-tertiary h-100">
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
            <div class="rounded-3 p-3 bg-body-tertiary h-100">
              <label class="form-label mb-1 me-1" for="locus-tag-increment"
                >Locus tag increment</label
              >
              <HelpTip text="Step between consecutive locus tag numbers." />
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
            <div class="rounded-3 p-3 bg-body-tertiary">
              <div class="mb-3">
                <h5 class="mb-0">Additional evidence files</h5>
                <div class="small text-secondary">Only applied when a file is provided.</div>
              </div>
              <div class="row g-3">
                <div class="col-md-6 col-xl-3">
                  <label class="form-label me-1" for="trusted-proteins-file"
                    >Trusted proteins</label
                  >
                  <HelpTip text="Protein FASTA of trusted sequences used for CDS annotation." />
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
                  <label class="form-label me-1" for="hmms-file">HMMs file</label>
                  <HelpTip
                    text="Trusted hidden Markov models in HMMER format used for CDS annotation."
                  />
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
                  <label class="form-label me-1" for="regions-file">Regions file</label>
                  <HelpTip
                    text="Pre-annotated regions in GFF3 or GenBank format (regions only, no functional annotations)."
                  />
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
                  <label class="form-label me-1" for="prodigal-training-file"
                    >Prodigal training file</label
                  >
                  <HelpTip text="Existing Prodigal training file used for CDS prediction." />
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
            <div class="rounded-3 p-3 bg-body-tertiary">
              <h5 class="mb-0">Skip features</h5>
              <div class="small text-secondary mb-3">
                Select annotations you want Bakta to skip.
              </div>
              <div class="row g-2">
                <div class="col-sm-6 col-lg-4" v-for="option in skipOptions" :key="option.key">
                  <div class="skip-wrap">
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
                    <HelpTip v-if="option.hint" class="skip-help" :text="option.hint" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import HelpTip from '@/components/HelpTip.vue'
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

const skipOptions: { key: SkipOptionKey; label: string; hint?: string }[] = [
  { key: 'skipTrna', label: 'Skip tRNA' },
  { key: 'skipTmrna', label: 'Skip tmRNA' },
  { key: 'skipRrna', label: 'Skip rRNA' },
  { key: 'skipNcrna', label: 'Skip ncRNA' },
  {
    key: 'skipNcrnaRegion',
    label: 'Skip ncRNA region',
    hint: 'ncRNA cis-regulatory regions',
  },
  { key: 'skipCrispr', label: 'Skip CRISPR' },
  { key: 'skipCds', label: 'Skip CDS' },
  { key: 'skipPseudo', label: 'Skip pseudogenes' },
  { key: 'skipSorf', label: 'Skip sORFs' },
  { key: 'skipGap', label: 'Skip gaps' },
  {
    key: 'skipOri',
    label: 'Skip ori',
    hint: 'Origins of replication and transfer (oriC, oriV, oriT)',
  },
  { key: 'skipFilter', label: 'Skip filters', hint: 'Feature overlap filters' },
  { key: 'skipPlot', label: 'Skip circular plot', hint: 'Circular genome plots' },
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

.baktfold-option {
  margin-top: 0.25rem;
  margin-inline: -0.5rem;
  padding: 0.3rem 0.5rem 0.3rem 2rem;
  border-radius: var(--bs-border-radius);
  background-color: rgba(var(--bs-primary-rgb), 0.09);
}

.skip-wrap {
  position: relative;
  height: 100%;
}

.skip-help {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
}

.skip-option:hover {
  border-color: var(--bs-secondary-color);
}
</style>
