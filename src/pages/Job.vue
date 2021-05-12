<template>
  <page-header page="" />
  <div class="container flex-grow-1">
    <progress-bar
      v-if="loadingProgress.enabled"
      :progress="loadingProgress"
      :title="loadingProgress.title"
    />

    <div v-if="!loadingProgress.enabled">
      <bakta-result-table :data="data" />
    </div>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter.vue";
import BaktaResultTable from "@/components/BaktaResultTable";
import notifyFetchProgress from "@/notify-fetch-progress";
import ProgressBar from "@/components/ProgressBar";

export default {
  name: "Job",
  components: { PageHeader, PageFooter, BaktaResultTable, ProgressBar },
  computed: {},
  data: function () {
    return {
      job: null,
      pollInterval: 2000,
      loadingProgress: {
        enabled: true,
        min: 0,
        max: 100,
        value: 0,
        title: "Loading results...",
      },

      data: {},
    };
  },
  methods: {
    udpateJob: function () {
      let token = this.$router.currentRoute.value.params.id;
      console.log(token);
      if (token) {
        let job = JSON.parse(atob(token));
        let vm = this;
        this.$bakta.job(job).then((x) => {
          // quick hack for rest api mock
          // vue does not update when the objects have the same reference
          vm.job = JSON.parse(JSON.stringify(x[0]));
          this.planRefresh();
        });
      }
    },
    loadDemoData: function () {
      const vm = this;
      window
        .fetch(
          "https://lj-bakta-test-data.s3.computational.bio.uni-giessen.de/test.json"
        )
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
        .then((response) => response.json())
        .then((text) => (vm.data = text))
        .then(() => (this.loadingProgress.enabled = false))
        .catch((err) => console.log(err));
    },
    planRefresh: function () {
      if (
        this.job.jobStatus === "SUCCESSFULL" ||
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
  mounted: function () {
    this.udpateJob();
    this.loadDemoData();
  },
};
</script>
<style scoped>
</style>