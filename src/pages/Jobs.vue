<template>
  <page-header page="Jobs" />
  <div class="container flex-grow-1">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Id</th>
          <th>Jobname</th>
          <th>Submission</th>
          <th>Last updated</th>
          <th>Status</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody v-if="!loading">
        <tr v-for="item in jobs" :key="item.key">
          <td>{{ item.jobID }}</td>
          <td>{{ item.name }}</td>
          <td>{{ formatDateTime(item.started) }}</td>
          <td>{{ formatDateTime(item.updated) }}</td>
          <td>{{ formatState(item.jobStatus) }}</td>
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

    <div v-if="!hasJobs">No jobs found</div>

    <div
      v-if="hasNotFound"
      class="d-flex flex-row-reverse row-cols-lg-auto align-items-end"
    >
      <div class="col-12 ">
        <div class="col-12">
          <button class="btn btn-secondary " @click="udpateJobs(true)">
            Remove outdated jobs from list
          </button>
        </div>
      </div>
    </div>

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
  data: function() {
    return {
      jobs: [],
      pollInterval: 5000,
      hideLocalJobs: false,
      timeout: null,
      loading: false,
    };
  },
  computed: {
    hasJobs: function() {
      return this.jobs != null && this.jobs.length > 0;
    },
    hasNotFound: function() {
      return this.jobs.some((j) => j.jobStatus === "NOT_FOUND");
    },
  },
  watch: {
    hideLocalJobs: function() {
      this.udpateJobs();
    },
  },
  methods: {
    formatState: function(state) {
      switch (state) {
        case "NOT_FOUND":
          return "OUTDATED";
      }
      return state;
    },
    formatDateTime: function(datestring) {
      if (datestring) {
        try {
          const date = Date.parse(datestring);
          return new Intl.DateTimeFormat([], {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(date);
        } catch (err) {
          return `Unable to format: '${datestring}'. Error: ${err}`;
        }
      } else {
        return "";
      }
    },
    udpateJobs: function(deleteUnknown = false) {
      let vm = this;
      vm.loading = true;
      this.$bakta.jobs(!this.hideLocalJobs, deleteUnknown).then((x) => {
        vm.jobs = x.sort(
          (a, b) =>
            new Date(b.started).valueOf() - new Date(a.started).valueOf()
        );
        this.planRefresh();
        vm.loading = false;
      });
    },
    planRefresh: function() {
      if (
        this.jobs.every(
          (j) =>
            this.isSuccessful(j) ||
            j.jobStatus === "ERROR" ||
            j.jobStatus === "UNAUTHORIZED" ||
            j.jobStatus === "NOT_FOUND"
        )
      ) {
        // all jobs are in finished state. No polling needed anymore
        console.debug(
          "All jobs finished or failed, no need to refresh",
          this.jobs
        );
        this.timeout = null;
      } else {
        if (this.timeout) {
          console.debug(
            "Job lookup already scheduled. Canceling",
            this.timeout
          );
          window.clearTimeout(this.timeout);
        }
        console.debug("Jobs still running, need to refresh", this.jobs);
        // trigger reload
        this.timeout = window.setTimeout(() => {
          this.timeout = null;
          this.udpateJobs();
        }, this.pollInterval);
      }
    },
    cancelRefresh: function() {
      if (this.timeout) {
        window.clearTimeout(this.timeout);
      }
    },
    isSuccessful: function(job) {
      return job.jobStatus === "SUCCESSFULL" || job.jobStatus === "SUCCESFULL";
    },
  },
  mounted: function() {
    this.udpateJobs();
  },
  unmounted: function() {
    this.cancelRefresh();
  },
};
</script>
