<template>
  <page-header page="Submit" />
  <div class="container flex-grow-1 page-body">
    <notification :message="error" />
    <div class="mb-3">
      <textarea
        class="form-control"
        name="paste-fasta"
        rows="8"
        placeholder="Paste your fasta sequences here or select a fasta file from your computer below..."
        v-model="sequenceInput"
      ></textarea>
    </div>
    <div class="input-group mb-3">
      <input
        class="form-control"
        type="file"
        id="fastaFile"
        @change="fastaFileChanged($event.target.name, $event.target.files)"
        accept=".fas,.fna,.fasta,.fna.gz,.fas.gz,.fasta.gz"
      />
    </div>

    <progress-bar
      v-if="loading"
      :progress="loadingProgress"
      :title="loadingProgress.title"
    />

    <div v-if="showDetails">
      <hr />
      <div class="mt-4">
        <h4 class="mb-2">Organism</h4>
        <div class="row">
          <div class="col">
            <remote-typeahead
              :suggestionLookup="lookupTaxonomy"
              v-model="genus_species"
              placeholder="Genus and species (optional)"
            />
          </div>

          <div class="col">
            <input
              class="form-control"
              type="text"
              id="strain"
              placeholder="Strain (optional)"
              v-model="options.strain"
            />
          </div>
        </div>
        <div class="row mt-2">
          <div class="col">
            <input
              class="form-control"
              type="text"
              id="locus"
              placeholder="Locus prefix (optional)"
              v-model="options.locus"
            />
          </div>
          <div class="col">
            <input
              class="form-control"
              type="text"
              id="locustag"
              placeholder="Locus tag prefix (optional)"
              v-model="options.locus_tag"
            />
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
                v-model="options.completeGenome"
                id="complete-genome"
              />
              <label class="form-check-label" for="complete-genome">
                Complete genome
              </label>
            </div>
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="options.keepContigHeaders"
                id="keep-headers"
              />
              <label class="form-check-label" for="keep-headers">
                Keep contig headers
              </label>
            </div>
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="options.compliant"
                id="compliant"
              />
              <label class="form-check-label" for="compliant">
                INSDC compliant output
              </label>
            </div>
          </div>
          <div class="col">
            <label class="form-label" for="min-contig-length">
              Min contig length
            </label>
            <input
              class="form-control"
              type="number"
              v-model="options.minContigLength"
              id="min-contig-length"
            />
          </div>
          <div class="col">
            <label class="form-label" for="translation-table">
              Translation table
            </label>
            <select-translation-table
              id="translation-table"
              v-model="options.translationTable"
            ></select-translation-table>
          </div>
          <div class="col">
            <label class="form-label" for="mono-diderm">Mono-/Diderm</label>
            <select-derm-type
              id="mono-diderm"
              v-model="options.dermType"
            ></select-derm-type>
          </div>
          <div class="col">
            <label class="form-label" for="prodigal-training-file">
              Prodigal training file
            </label>

            <input
              class="form-control"
              type="file"
              id="prodigal-training-file"
              @change="
                prodigalFileChanged($event.target.name, $event.target.files)
              "
              accept=".tf"
            />
          </div>
        </div>
        <div class="mt-4">
          <h4 class="mb-2">Replicons</h4>
          <div class="row scroll">
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
                <tr v-for="item in replicons" :key="item.id">
                  <td>
                    <input
                      class="form-control"
                      type="text"
                      readonly
                      :value="item.id"
                    />
                  </td>
                  <td>
                    <input
                      class="form-control"
                      type="number"
                      readonly
                      :value="item.length"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      v-model="item.new"
                      class="form-control"
                      placeholder="Optional..."
                    />
                  </td>
                  <td>
                    <select-sequence-type
                      v-model="item.type"
                      :complete="options.completeGenome"
                    />
                  </td>
                  <td>
                    <select-topology
                      v-model="item.topology"
                      :complete="options.completeGenome"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      v-model="item.name"
                      class="form-control"
                      placeholder="Optional..."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="d-flex justify-content-end mb-5">
          <button
            v-if="!submitting"
            class="btn btn-secondary"
            type="button"
            id="submit-button"
            :disabled="!valid"
            @click="submit()"
          >
            Submit
          </button>
          <button
            v-if="submitting"
            class="btn btn-secondary"
            type="button"
            disabled
          >
            Submitting...
          </button>
        </div>
      </div>
    </div>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import SelectTranslationTable from "@/components/SelectTranslationTable";
import SelectDermType from "@/components/SelectDermType.vue";
import SelectTopology from "@/components/SelectTopology";
import SelectSequenceType from "../components/SelectSequenceType.vue";
import Notification from "@/components/Notification";
import PageFooter from "@/components/PageFooter";
import fasta from "biojs-io-fasta";
import { validateDna } from "@/fasta-validator";
import ProgressBar from "../components/ProgressBar.vue";
import readFileWithProgress from "@/read-file-with-progress";
import { RemoteTypeahead } from "@ljelonek-public/vue-bootstrap5-components";

export default {
  name: "Submit",
  components: {
    PageHeader,
    PageFooter,
    SelectTranslationTable,
    SelectDermType,
    SelectTopology,
    SelectSequenceType,
    Notification,
    ProgressBar,
    RemoteTypeahead,
  },

  methods: {
    lookupTaxonomy: function(input, result) {
      window
        .fetch(
          "https://www.ebi.ac.uk/ena/taxonomy/rest/suggest-for-search/" + input
        )
        .then((r) => r.json())
        .then((j) => {
          result(
            j.map((x) => ({ value: x.scientificName, label: x.scientificName }))
          );
        });
    },
    setSequence(seq) {
      this.sequence = seq;
      this.loading = false;
    },
    fastaFileChanged: function(name, file) {
      let vm = this;
      this.sequenceFile = file.item(0);
      if (this.sequenceFile === null) {
        vm.setSequence(null);
      } else {
        this.readTextFile(this.sequenceFile)
          .then((r) => vm.setSequence(r))
          .catch((e) => (vm.error = e));
      }
    },
    parseAndSetSeqquence: function() {
      try {
        let seq = fasta.parse(this.sequence);
        // fix windows newline characters as the fasta parser has problems to handle them
        seq.forEach((x) => (x.seq = x.seq.replaceAll("\r", "")));

        let valid = validateDna(seq);
        if (valid.valid) {
          this.replicons = seq.map(function(x) {
            return {
              id: x.name,
              length: x.seq.length,
              newid: "",
              type: "contig",
              topology: "l",
              name: "",
            };
          });
          this.loading = false;
          this.validSequenceFile = true;
          this.error = null;
        } else {
          this.loading = false;
          this.validSequenceFile = false;
          this.error = ["Invalid fasta:", ...valid.messages];
        }
      } catch (e) {
        this.loading = false;
        this.validSequenceFile = false;
        this.error = "Invalid fasta file. Please provide a valid fasta.";
      }
    },
    readTextFile: function(file) {
      this.loading = true;
      this.sequence = null;
      const vm = this;
      return readFileWithProgress(
        file,
        (x) => (vm.loadingProgress.value = Math.floor(x * 100))
      ).then((buffer) => {
        return new Promise((r) => {
          let decoder = new TextDecoder("utf-8");
          r(decoder.decode(buffer));
        });
      });
    },
    prodigalFileChanged: function(name, file) {
      this.prodigalTrainingFile = file[0];
    },
    submit: function() {
      let vm = this;
      this.submitting = true;
      this.error = null;
      this.$bakta
        .submit(this.request)
        .then((x) => {
          console.debug("Job submitted", x);
          vm.submitting = false;
          vm.$router.push({ name: "Jobs" });
        })
        .catch((ex) => {
          console.log("Submission failed", ex);
          vm.submitting = false;
          vm.error = ex;
        });
    },
  },
  watch: {
    sequenceInput(newValue) {
      if (
        this.sequenceFile === null ||
        (this.sequenceFile !== null && !this.validSequenceFile)
      ) {
        this.sequence = newValue;
      }
    },
    sequence() {
      if (this.sequence !== null) {
        try {
          this.loading = true;
          this.loadingProgress.title = "Parsing file";
          setTimeout(this.parseAndSetSeqquence, 0);
        } catch (e) {
          this.error = "Can't read fasta data";
          this.replicons = [];
          this.validSequenceFile = false;
        }
      } else {
        this.validSequenceFile = false;
        this.error = null;
        this.replicons = [];
      }
    },
    genus_species() {
      if (this.genus_species) {
        const split = this.genus_species.indexOf(" ");
        if (split >= 0) {
          this.options.genus = this.genus_species.substring(0, split);
          this.options.species = this.genus_species.substring(split + 1);
        } else {
          this.options.genus = this.genus_species;
          this.options.species = "";
        }
      }
    },
    "options.completeGenome": function() {
      let possibleTopologies = [];
      let possibleTypes = [];
      let newTopology = null;
      let newType = null;

      if (this.options.completeGenome) {
        possibleTypes = ["chromosome", "plasmid"];
        possibleTopologies = ["c"];
        newTopology = "c";
        newType = "chromosome";
      } else {
        possibleTypes = ["contig"];
        possibleTopologies = ["l"];
        newTopology = "l";
        newType = "contig";
      }

      this.replicons
        .filter((x) => !possibleTypes.some((y) => x.type === y))
        .forEach((x) => (x.type = newType));
      this.replicons
        .filter((x) => !possibleTopologies.some((y) => x.topology === y))
        .forEach((x) => (x.topology = newTopology));
    },
  },
  computed: {
    showDetails() {
      return this.replicons.length > 0;
    },
    valid() {
      return this.showDetails;
    },
    request() {
      return {
        jobname: this.sequenceFile
          ? this.sequenceFile.name
          : "Manually entered sequence(s)",
        sequence: this.sequence,
        prodigal: this.prodigalTrainingFile,
        replicons: this.replicons,
        options: this.options,
      };
    },
  },
  data() {
    return {
      sequence: "",
      sequenceInput: "",
      sequenceFile: null,
      validSequenceFile: false,
      genus_species: "",
      options: {
        translationTable: 11,
        completeGenome: false,
        keepContigHeaders: false,
        minContigLength: 1,
        dermType: "UNKNOWN",
        prodigalTrainingFile: null,
        genus: "",
        species: "",
        strain: "",
        locus: "",
        locus_tag: "",
        compliant: false,
      },
      replicons: [],
      submitting: false,
      error: null,
      loading: false,
      loadingProgress: {
        title: "Loading fasta file",
        min: 0,
        max: 100,
        value: 0,
      },
    };
  },
};
</script>
<style scoped>
h4 {
  color: gray;
}
form-label {
  color: gray;
}
.scroll {
  overflow: auto;
  max-height: 20em;
}
</style>
