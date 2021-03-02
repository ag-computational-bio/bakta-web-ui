<template>
  <page-header page="Jobs" />
  <div class="container flex-grow-1 ">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Id</th>
          <th>Submission</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in jobs" :key="item.key">
          <td>{{ item.jobID }}</td>
          <td>{{ item.secret }}</td>
          <td>{{ item.jobStatus }}</td>
          <td>
            <router-link :to="{ name: 'Job', params: { id: item.key } }"
              >Link</router-link
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter.vue";

export default {
  name: "Jobs",
  components: { PageHeader, PageFooter },
  data: function () {
    return { jobs: [], pollInterval: 2000 };
  },
  methods: {
    udpateJobs: function () {
      let vm = this;
      this.$bakta.jobs().then((x) => {
        vm.jobs = x;
        this.planRefresh();
      });
    },
    planRefresh: function () {
      if (
        this.jobs.every(
          (j) => j.jobStatus === "SUCCESSFULL" || j.jobStatus === "ERROR"
        )
      ) {
        // all jobs are in finished state. No polling needed anymore
        console.debug(
          "All jobs finished or failed, no need to refresh",
          this.jobs
        );
      } else {
        console.debug("Jobs still running, need to refresh", this.jobs);
        // trigger reload
        window.setTimeout(() => {
          this.udpateJobs();
        }, this.pollInterval);
      }
    },
  },
  mounted: function () {
    this.udpateJobs();
  },
};
</script>