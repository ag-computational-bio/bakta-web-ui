<template>
  <page-header page="Jobs" />
  <div class="container flex-grow-1">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Id</th>
          <th>Submission</th>
          <th>Started</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody v-if="!loading">
        <tr v-for="item in jobs" :key="item.key">
          <td>{{ item.jobID }}</td>
          <td>{{ item.started }}</td>
          <td>{{ item.updated }}</td>
          <td>{{ item.jobStatus }}</td>
          <td>
            <router-link
              v-if="isSuccessful(item)"
              :to="{ name: 'Job', params: { id: item.key } }"
            >
              Link
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row d-flex justify-content-center" v-if="loading">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
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
    return { jobs: [], pollInterval: 5000, loading: true };
  },
  methods: {
    udpateJobs: function () {
      let vm = this;
      vm.loading = true;
      this.$bakta.jobs().then((x) => {
        vm.jobs = x.sort(
          (a, b) =>
            new Date(b.started).valueOf() - new Date(a.started).valueOf()
        );
        this.planRefresh();
        vm.loading = false;
      });
    },
    planRefresh: function () {
      if (
        this.jobs.every((j) => this.isSuccessful(j) || j.jobStatus === "ERROR")
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
    isSuccessful: function (job) {
      return job.jobStatus === "SUCCESSFULL" || job.jobStatus === "SUCCESFULL";
    },
  },
  mounted: function () {
    this.udpateJobs();
  },
};
</script>