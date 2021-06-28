<template>
  <div class="row mb-5">
    <div class="col-md-6">
      <h5>Input</h5>
      <display-tuple label="Organism:" :value="name" />
      <display-tuple label="Sequences:" :value="sequencesCount" />
      <display-tuple label="Genome size:" :value="size" />
    </div>

    <div v-if="job" class="col-md-6">
      <h5>Runtime</h5>
      <display-tuple label="Start:" :value="started" />
      <display-tuple label="Stop:" :value="ended" />
      <display-tuple label="Duration:" :value="duration" />
    </div>
  </div>

  <div class="row">
    <div class="col-md-10">
      <h5>Output</h5>
      <div class="row">
        <div class="col-md-4">
          <display-tuple
            :break="6"
            label="tRNA:"
            :value="featureCount['tRNA']"
          />
          <display-tuple
            :break="6"
            label="tmRNA:"
            :value="featureCount['tmRNA']"
          />
          <display-tuple
            :break="6"
            label="rRNA:"
            :value="featureCount['rRNA']"
          />
          <display-tuple
            :break="6"
            label="ncRNA:"
            :value="featureCount['ncRNA']"
          />
        </div>
        <div class="col-md-4">
          <display-tuple
            :break="6"
            label="ncRNA regions:"
            :value="featureCount['ncRNA-region']"
          />
          <display-tuple
            :break="6"
            label="CRISPR:"
            :value="featureCount['crispr']"
          />
          <display-tuple :break="6" label="CDS:" :value="featureCount['cds']" />
          <display-tuple
            :break="6"
            label="sORF:"
            :value="featureCount['sorf']"
          />
        </div>
        <div class="col-md-4">
          <display-tuple
            :break="6"
            label="oriC:"
            :value="featureCount['oriC']"
          />
          <display-tuple
            :break="6"
            label="oriV:"
            :value="featureCount['oriV']"
          />
          <display-tuple
            :break="6"
            label="oriT:"
            :value="featureCount['oriT']"
          />
          <display-tuple :break="6" label="gap:" :value="featureCount['gap']" />
        </div>
        <div class="col-md-3"></div>
      </div>
    </div>
    <div v-if="job" class="col-md-2 text-end">
      <h5>Download</h5>
      <div v-for="d in downloads" :key="d.key" class="row">
        <a :href="job.ResultFiles[d.key]">{{ d.label }}</a>
      </div>
    </div>
  </div>
</template>

<script>
import humanizeDuration from "humanize-duration";
import DisplayTuple from "@/components/DisplayTuple";
import bakta from "@/bakta-helper";
export default {
  name: "BaktaResultView",
  components: { DisplayTuple },
  props: {
    data: {
      type: Object,
      default: () => {},
    },
    job: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    name: function() {
      return bakta.genomeName(this.data);
    },
    size: function() {
      return bakta.formattedSize(this.data);
    },
    featureCount: function() {
      return bakta.featureCount(this.data);
    },
    sequencesCount: function() {
      return bakta.sequencesCountString(this.data);
    },
    started: function() {
      return this.formatDate(this.job.started);
    },
    ended: function() {
      return this.formatDate(this.job.updated);
    },
    duration: function() {
      return this.formatDuration(this.job.started, this.job.updated);
    },
    downloads: function() {
      const order = {
        TSV: { label: "tsv", position: 0 },
        TSVHypothetical: { label: "tsv (hypothetical)", position: 5 },
        GFF3: { label: "gff3", position: 10 },
        GBFF: { label: "gbff", position: 20 },
        FAA: { label: "faa", position: 30 },
        FAAHypothetical: { label: "faa (hypothetical)", position: 35 },
        FNA: { label: "fna", position: 40 },
        JSON: { label: "json", position: 50 },
      };
      let resultFiles =
        this.job && this.job.ResultFiles ? this.job.ResultFiles : {};

      let l = [];
      for (let k of Object.keys(resultFiles)) {
        if (k in order) {
          l.push({ key: k, ...order[k] });
        } else {
          l.push({ key: k, label: k, position: 1000 });
        }
      }
      return l.sort((a, b) => a.position - b.position);
    },
  },
  data: function() {
    return {};
  },
  methods: {
    formatDate(date) {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(date));
    },
    formatDuration(from, to) {
      return humanizeDuration(
        new Date(to).getTime() - new Date(from).getTime()
      );
    },
  },
  mounted: function() {},
};
</script>

<style></style>
