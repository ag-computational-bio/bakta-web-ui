<template>
  <div class="row mb-4 mt-5">
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

  <h4 class="mt-3">Annotations</h4>
  <datatable
    :columns="columns"
    :dataSet="table"
    :configuration="dataTableConfig"
  />
</template>

<script>
import Datatable from "@/components/Datatable.vue";
import DisplayTuple from "@/components/DisplayTuple";

export default {
  name: "BaktaResultView",
  components: { Datatable, DisplayTuple },
  props: {
    data: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    name: function () {
      if (!this.genus && !this.genus && !this.species) {
        return "N.A.";
      }
      if (this.genus) {
        return (
          this.genus +
          (this.species ? this.species + " " : "") +
          (this.strain ? this.strain + " " : "")
        );
      } else {
        return (
          "N.A. " +
          (this.species ? this.species + " " : "") +
          (this.strain ? this.strain + " " : "")
        );
      }
    },
    size: function () {
      return (
        new Intl.NumberFormat("en-GB").format(this.data.stats.size) + " bp"
      );
    },
    table: function () {
      return this.data.features.map((x) => ({
        contig: x.contig || "",
        type: x.type || "",
        start: x.start || "",
        stop: x.stop || "",
        strand: x.strand || "",
        locus: x.locus || "",
        product: x.product || "",
        dbxrefs: x.db_xrefs ? x.db_xrefs.join("<br> ") : "",
      }));
    },
    featureCount: function () {
      return this.table.reduce(
        (acc, cur) => {
          const key = cur.type;
          if (!(key in acc)) {
            acc[key] = 0;
          }
          acc[key] = acc[key] + 1;
          return acc;
        },
        {
          oriC: 0,
          oriV: 0,
          oriT: 0,
          cds: 0,
          gap: 0,
          sorf: 0,
          "ncRNA-region": 0,
          ncRNA: 0,
          rRNA: 0,
          tmRNA: 0,
          crispr: 0,
          tRNA: 0,
        }
      );
    },
    sequencesCount: function () {
      const data = this.data.sequences.map(
        (x) => (x.complete ? "complete " : "") + x.type
      );
      const counts = data.reduce((acc, cur) => {
        if (!(cur in acc)) {
          acc[cur] = 0;
        }
        acc[cur] = acc[cur] + 1;
        return acc;
      }, {});
      const string = Object.entries(counts)
        .sort()
        .map((x) => {
          let s = x[1] + " " + x[0];
          if (x[1] > 1) {
            s += "s";
          }
          return s;
        })
        .join(", ");
      return string;
    },
  },
  data: function () {
    return {
      dataTableConfig: {
        scrollY: "70vh",
        scrollCollapse: true,
        paging: true,
        pageLength: 100,
        processing: true,
        deferRender: true,
        lengthMenu: [50, 100, 250],
      },

      columns: [
        { data: "contig", title: "Sequence" },
        { data: "type", title: "Type" },
        { data: "start", title: "Start" },
        { data: "stop", title: "Stop" },
        { data: "strand", title: "Strand" },
        { data: "locus", title: "Locus tag" },
        { data: "product", title: "Product" },
        { data: "dbxrefs", title: "DbXrefs" },
      ],
    };
  },
  methods: {},
  mounted: function () {},
};
</script>
<style scoped>
h4 {
  color: gray;
}
h5 {
  color: gray;
}
h6 {
  color: gray;
}
.value {
  font-weight: bold;
  color: gray;
}
</style>
