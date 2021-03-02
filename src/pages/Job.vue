<template>
  <page-header page="" />
  <div class="container">
    <div v-if="job === null">Loading data...</div>
    <div v-else>
      <ul>
        <li>Job id: {{ job.jobID }}</li>
        <li>Job status: {{ job.jobStatus }}</li>
      </ul>
    </div>
  </div>
</template>
<script>
import PageHeader from "@/components/PageHeader";
export default {
  name: "Job",
  components: { PageHeader },
  data: function () {
    return { job: null, pollInterval: 2000};
  },
  methods: {
    udpateJob: function () {
      let token = this.$router.currentRoute.value.params.id
      console.log(token)
      if (token) {
          let job = JSON.parse(atob(token));
          let vm = this;
          this.$bakta.job(job).then((x) => {
            // quick hack for rest api mock
            // vue does not update when the objects have the same reference
            vm.job = JSON.parse(JSON.stringify(x[0]))
            this.planRefresh();
          });
      }
    },
    planRefresh: function () {
      if (this.job.jobStatus === "SUCCESSFULL" || this.job.jobStatus === "ERROR") {
        //  jobs is in finished state. No polling needed anymore
        console.debug("Jobs is finished or failed, no need to refresh", this.job)
      } else {
        console.debug("Job is still running, need to refresh", this.job)
        // trigger reload
        window.setTimeout(() => {
          this.udpateJob();
        }, this.pollInterval);
      }
    },
  },
  mounted: function () {
    this.udpateJob();
  },
};
</script>