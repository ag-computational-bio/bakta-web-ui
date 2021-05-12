<template>
  <div class="row">
    <div class="col-md-6">
      <h5>Input</h5>
      <display-tuple label="Organism:" :value="name" />
      <display-tuple label="Sequences:" :value="sequencesCount" />
      <display-tuple label="Genome size:" :value="size" />
    </div>

    <div class="col-md-6">
      <h5>Runtime</h5>
      <display-tuple label="Start:" value="2020-12-10 9:35:00" />
      <display-tuple label="Stop:" value="2020-12-10 9:35:00" />
      <display-tuple label="Duration:" value="11:00" />
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
    <div class="col-md-2 text-end">
      <h5>Download</h5>
      <div class="row"><a href="#">tsv</a></div>
      <div class="row"><a href="#">gff3</a></div>
      <div class="row"><a href="#">gbff</a></div>
      <div class="row"><a href="#">faa</a></div>
      <div class="row"><a href="#">fna</a></div>
      <div class="row"><a href="#">json</a></div>
    </div>
  </div>
</template>

<script>
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
  },
  computed: {
    name: function () {
      return bakta.genomeName(this.data);
    },
    size: function () {
      return bakta.formattedSize(this.data);
    },
    featureCount: function () {
      return bakta.featureCount(this.data);
    },
    sequencesCount: function () {
      return bakta.sequencesCountString(this.data);
    },
  },
  data: function () {
    return {};
  },
  methods: {},
  mounted: function () {},
};
</script>

<style>
</style>