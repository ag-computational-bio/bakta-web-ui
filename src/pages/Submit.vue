<template>
  <page-header page="Submit" />
  <div class="container page-body">
    <div v-if="message !== null" class="alert alert-danger">
      {{ message }}
    </div>
    <div class="mb-3">
      <textarea
        class="form-control"
        name="paste-fasta"
        cols="120"
        rows="15"
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
        accept=".fas,.fna,.fasta"
      />
    </div>
    <div v-if="showDetails">
      <hr />
      <div class="mt-4">
        <h4 class="mb-2">Organism</h4>
        <div class="row">
          <div class="col">
            <input
              class="form-control"
              type="text"
              id="genus"
              placeholder="Genus"
              v-model="genus"
            />
          </div>
          <div class="col">
            <input
              class="form-control"
              type="text"
              id="species"
              placeholder="Species"
              v-model="species"
            />
          </div>
          <div class="col">
            <input
              class="form-control"
              type="text"
              id="strain"
              placeholder="Strain"
              v-model="strain"
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
                v-model="completeGenome"
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
                v-model="keepContigHeaders"
                id="keep-headers"
              />
              <label class="form-check-label" for="keep-headers">
                Keep contig headers
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
              v-model="minContigLength"
              id="min-contig-length"
            />
          </div>
          <div class="col">
            <label class="form-label" for="translation-table">
              Translation table
            </label>
            <select-translation-table
              id="translation-table"
              v-model="translationTable"
            ></select-translation-table>
          </div>
          <div class="col">
            <label class="form-label" for="mono-diderm">Mono-/Diderm</label>
            <select-derm-type
              id="mono-diderm"
              v-model="dermType"
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
          <div class="row">
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
                <tr v-for="item in fastaContent" :key="item.id">
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
                  <td><select-sequence-type v-model="item.type" /></td>
                  <td><select-topology v-model="item.topology" /></td>
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
            class="btn btn-secondary"
            type="button"
            id="submit-button"
            @click="handle()"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import PageHeader from "@/components/PageHeader";
import SelectTranslationTable from "@/components/SelectTranslationTable";
import SelectDermType from "@/components/SelectDermType.vue";
import SelectTopology from "@/components/SelectTopology";
import SelectSequenceType from "../components/SelectSequenceType.vue";
import fasta from "biojs-io-fasta";

export default {
  name: "Submit",
  components: {
    PageHeader,
    SelectTranslationTable,
    SelectDermType,
    SelectTopology,
    SelectSequenceType,
  },

  methods: {
    fastaFileChanged: function (name, file) {
      let vm = this;
      this.sequenceFile = file.item(0);
      let reader = new FileReader();
      reader.onload = function (text) {
        vm.sequence = text.target.result;
      };
      reader.readAsText(this.sequenceFile);
    },
    prodigalFileChanged: function (name, file) {
      this.prodigalTrainingFile = file[0];
    },
    handle: function () {
      console.log(this);
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
          let seq = fasta.parse(this.sequence);
          this.fastaContent = seq.map(function (x) {
            return {
              id: x.name,
              length: x.seq.length,
              newid: "",
              type: "chromosome",
              topology: "l",
              name: "",
            };
          });
          this.validSequenceFile = true;
          this.message = null;
        } catch (e) {
          this.message = "Can't read fasta data";
          this.fastaContent = [];
          this.validSequenceFile = false;
        }
      } else {
        this.validSequenceFile = false;
        this.message = null;
        this.fastaContent = [];
      }
    },
  },
  computed: {
    showDetails() {
      return this.fastaContent.length > 0;
    },
  },
  data() {
    return {
      message: null,
      sequence: "",
      sequenceInput: "",
      sequenceFile: null,
      validSequenceFile: false,
      translationTable: 11,
      completeGenome: false,
      keepContigHeaders: false,
      minContigLength: 1,
      dermType: "UNKNOWN",
      prodigalTrainingFile: null,
      genus: "",
      species: "",
      strain: "",
      fastaContent: [],
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
</style>