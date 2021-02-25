<template>
  <page-header page="Submit" />
  <div class="container page-body">
    <div class="mb-3">
      <textarea
        class="form-control"
        name="paste-fasta"
        cols="120"
        rows="15"
        placeholder="Paste your fasta sequences here or select a fasta file from your computer below..."
        v-model="sequence"
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
                <td>{{ item.id }}</td>
                <td>{{ item.length }}</td>
                <td><input type="text" v-model="item.new" /></td>
                <td>{{ item.type }}</td>
                <td>{{ item.topology }}</td>
                <td>{{ item.name }}</td>
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
</template>
<script>
import PageHeader from "@/components/PageHeader";
import SelectTranslationTable from "@/components/SelectTranslationTable";
import SelectDermType from "../components/SelectDermType.vue";
export default {
  name: "Submit",
  components: { PageHeader, SelectTranslationTable, SelectDermType },

  methods: {
    fastaFileChanged: function (name, file) {
      this.sequenceFile = file[0];
    },
    prodigalFileChanged: function (name, file) {
      this.prodigalTrainingFile = file[0];
    },
    handle: function () {
      console.log(this);
    },
  },
  watch: {
    translationTable(t) {
      console.log(t);
    },
  },
  data() {
    return {
      sequence: "",
      sequenceFile: null,
      translationTable: 11,
      completeGenome: false,
      keepContigHeaders: false,
      minContigLength: 1,
      dermType: "UNKNOWN",
      prodigalTrainingFile: null,
      genus: "",
      species: "",
      strain: "",
      fastaContent: [
        {
          id: "NODE_1",
          length: 123,
          newid: "",
          type: "",
          topology: "",
          name: "",
        },
        {
          id: "NODE_2",
          length: 123,
          newid: "",
          type: "",
          topology: "",
          name: "",
        },
        {
          id: "NODE_3",
          length: 123,
          newid: "",
          type: "",
          topology: "",
          name: "",
        },
        {
          id: "NODE_4",
          length: 123,
          newid: "",
          type: "",
          topology: "",
          name: "",
        },
      ],
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