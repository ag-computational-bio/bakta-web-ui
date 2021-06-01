<template>
  <page-header page="" />
  <div class="container flex-grow-1">
    <notification
      message="You can visualize bakta json files with this viewer. The data is visualized inside your browser. None of your data is send to the server."
      type="warning"
    />
    <div class="input-group mb-3">
      <input
        class="form-control"
        type="file"
        id="bakta-json"
        @change="jsonFileChanged($event.target.name, $event.target.files)"
        accept=".json"
      />
    </div>
    <notification :message="error" />
    <progress-bar
      v-if="loadingProgress.enabled"
      :progress="loadingProgress"
      :title="loadingProgress.title"
    />

    <div v-if="!loadingProgress.enabled && !error && data">
      <div class="mt-5">
        <h4>
          Job statistics
        </h4>
        <div class="" id="stats">
          <div class="card card-body">
            <bakta-stats :data="data" />
          </div>
        </div>
      </div>
      <hr />
      <div class="row">
        <h4>
          Genomeviewer
        </h4>
        <div class="" id="genomeBrowser">
          <div class="card card-body">
            <bakta-genome-viewer ref="genomeview" :data="data" />
          </div>
        </div>
      </div>
      <hr />
      <h4>
        Annotations
      </h4>
      <div class="" id="annotationTable">
        <div class="card card-body">
          <bakta-annotation-table :data="data" />
        </div>
      </div>
      <hr />
    </div>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter.vue";
import Notification from "@/components/Notification";
import ProgressBar from "@/components/ProgressBar";
import BaktaGenomeViewer from "@/components/BaktaGenomeViewer";
import BaktaStats from "@/components/BaktaStats";
import BaktaAnnotationTable from "@/components/BaktaAnnotationTable";

export default {
  name: "Job",
  components: {
    PageHeader,
    PageFooter,
    ProgressBar,
    BaktaGenomeViewer,
    BaktaStats,
    BaktaAnnotationTable,
    Notification,
  },
  computed: {},
  data: function() {
    return {
      pollInterval: 2000,
      loadingProgress: {
        enabled: false,
        min: 0,
        max: 100,
        value: 0,
        title: "Loading results...",
      },
      error: null,
      data: null,
    };
  },
  methods: {
    handleError: function(err) {
      this.error = err;
    },
    jsonFileChanged: function(name, file) {
      console.log(name, file);
      this.loadData(file.item(0));
    },
    loadData: function(file) {
      console.log(file);
      this.loadingProgress.enabled = true;
      this.loadingProgress.value = 0;
      const vm = this;

      this.loadingProgress.title =
        "Processing data. This may take a while for larger genomes.";
      this.loadingProgress.type = "indeterminate";
      var reader = new FileReader();
      reader.onload = function(event) {
        vm.data = JSON.parse(event.target.result);
        console.log(vm.data);
        vm.loadingProgress.enabled = false;
      };
      reader.readAsText(file);
    },
    setError(err) {
      this.error = err;
      this.loadingProgress.enabled = false;
    },
  },
  mounted: function() {},
};
</script>
<style scoped></style>
