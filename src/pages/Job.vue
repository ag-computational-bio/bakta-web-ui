<template>
  <page-header page="" />
  <div class="container flex-grow-1">
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
            <bakta-stats :data="data" :job="result" />
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
import notifyFetchProgress from "@/notify-fetch-progress";
import ProgressBar from "@/components/ProgressBar";
import BaktaGenomeViewer from "@/components/BaktaGenomeViewer";
import BaktaStats from "@/components/BaktaStats";
import BaktaAnnotationTable from "@/components/BaktaAnnotationTable";
import { expectOk } from "@/fetch-helper";

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
      job: null,
      result: null,
      pollInterval: 2000,
      loadingProgress: {
        enabled: true,
        min: 0,
        max: 100,
        value: 0,
        title: "Loading results...",
      },
      error: null,
      data: {},
    };
  },
  methods: {
    handleError: function(err) {
      this.error = err;
    },
    udpateJob: function() {
      let token = this.$router.currentRoute.value.params.id;
      if (token) {
        let job = JSON.parse(atob(token));
        let vm = this;
        this.$bakta
          .job(job)
          .then((x) => {
            vm.job = x[0];
            vm.loadResult({ jobID: vm.job.jobID, secret: vm.job.secret });
            this.planRefresh();
          })
          .catch(this.handleError);
      }
    },
    loadResult: function(job) {
      this.$bakta
        .result(job)
        .then((x) => (this.result = x))
        .then(() => {
          if (
            this.result &&
            this.result.ResultFiles &&
            this.result.ResultFiles.JSON
          ) {
            this.loadData(this.result.ResultFiles.JSON);
          } else {
            this.error = "No result found for job.";
          }
        });
    },
    loadData: function(url) {
      this.loadingProgress.enabled = true;
      this.loadingProgress.value = 0;
      const vm = this;
      window
        .fetch(url)
        .then(expectOk)
        .then((response) =>
          notifyFetchProgress(
            response,
            (x) => {
              this.loadingProgress.value = Math.floor(x * 100);
            },
            () => {
              this.loadingProgress.title =
                "Processing data. This may take a while for larger genomes.";
              this.loadingProgress.type = "indeterminate";
            }
          )
        )
        .then((stream) => new Response(stream))
        .then((response) => response.text())
        .then((text) => {
          try {
            vm.data = JSON.parse(text);
            return Promise.resolve(vm.data);
          } catch (ex) {
            try {
              vm.data = JSON.parse(text.replace(/:\s?NaN/g, ": null"));
              return Promise.resolve(vm.data);
            } catch (ex2) {
              return Promise.reject(ex2);
            }
          }
        })
        .then(() => (this.loadingProgress.enabled = false))
        .catch(vm.setError);
    },
    setError(err) {
      this.error = err;
      this.loadingProgress.enabled = false;
    },
    planRefresh: function() {
      if (
        this.job.jobStatus === "SUCCESSFULL" ||
        this.job.jobStatus === "SUCCESFULL" ||
        this.job.jobStatus === "ERROR"
      ) {
        //  jobs is in finished state. No polling needed anymore
        console.debug(
          "Jobs is finished or failed, no need to refresh",
          this.job
        );
      } else {
        console.debug("Job is still running, need to refresh", this.job);
        // trigger reload
        window.setTimeout(() => {
          this.udpateJob();
        }, this.pollInterval);
      }
    },
  },
  mounted: function() {
    this.udpateJob();
  },
};
</script>
<style scoped></style>
