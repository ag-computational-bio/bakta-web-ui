<template>
  <div ref="igv"></div>
</template>

<script>
import igv from "igv";
import fasta from "biojs-io-fasta";
import cog from "@/cog-helper";
import bakta from "@/bakta-helper";

export default {
  name: "IgvViewer",
  props: {
    data: { type: Object, default: () => {} },
  },
  watch: {
    data: function() {
      this.setupIgv();
    },
  },
  computed: {
    features: function() {
      return this.data.features.map((x) => {
        const feature = {
          chr: x.contig,
          start: x.start,
          end: x.stop,
          strand: x.strand,
          type: x.type,
          color: this.color(x),
        };

        if ("locus" in x) feature.locus = x.locus || "";
        if ("gene" in x) feature.gene = x.gene || "";

        if ("product" in x) feature.product = x.product || "";
        if ("product" in x) feature.name = x.product || "";
        if ("cds" === x.type) {
          const cogs = this.lookupCog(x);
          if (cogs.length > 0) feature.cog = cog.lookupCogLabels(cogs);
        }

        return feature;
      });
    },
    seqEntries: function() {
      return this.data.sequences.map((x) => {
        return { name: x.id, seq: x.sequence };
      });
    },
    fasta: function() {
      return fasta.write(this.seqEntries);
    },
    fastaUrl: function() {
      const blob = new Blob([this.fasta], { type: "text/plain" });
      return URL.createObjectURL(blob);
    },
  },
  data: function() {
    return {
      igv: null,
    };
  },
  methods: {
    setupIgv: function() {
      const track = (name, types) => ({ name: name, types: types });
      const featuretracks = [
        track("CDS/sORF", ["cds", "sorf"]),
        track("tRNA/tmRNA/rRNA", ["tRNA", "tmRNA", "rRNA"]),
        track("ncRNA", ["ncRNA"]),
        track("ncRNA-region", ["ncRNA-region"]),
        track("CRISPR", ["crispr"]),
        track("Gap", ["gap"]),
        track("oriC/oriV/oriT", ["oriC", "oriV", "oriT"]),
      ];
      const tracks = [];
      for (let t of featuretracks) {
        const features =
          this.features.filter((x) => t.types.some((y) => x.type === y)) || [];
        tracks.push({
          name: t.name,
          type: "annotation",
          features: features,
        });
      }

      const config = {
        reference: {
          id: this.data.genome.genus,
          fastaURL: this.fastaUrl,
          indexed: false,
          tracks: tracks,
          wholeGenomeView: false,
        },
      };
      igv.createBrowser(this.$refs.igv, config).then((x) => {
        this.igv = x;
        console.log("IGV browser created");
      });
    },
    refresh: function() {
      if (this.igv) this.igv.visibilityChange();
    },
    lookupName: function(feature) {
      if (feature.product) return feature.product;
      else if (feature.gene) return feature.gene;
      else return feature.locus;
    },
    lookupCogLabels: function(coglist) {
      return cog.lookupCogLabels(coglist).join("<br>");
    },
    lookupCog(feature) {
      return bakta.lookupCogFunctionalCategories(feature);
    },
    color: function(feature) {
      if (feature.type === "cds")
        return cog.lookupCogColor(this.lookupCog(feature));
      if (feature.type === "tRNA") return "rgb(255,0,0)";
      if (feature.type === "rRNA") return "rgb(0,255,100)";
      return "rgb(100,0,0)";
    },
  },
  mounted: function() {
    this.setupIgv();
  },
};
</script>

<style></style>
