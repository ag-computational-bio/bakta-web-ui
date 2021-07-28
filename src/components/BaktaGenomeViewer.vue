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
      return this.data.features
        .map((x) => {
          return this.createFeatures(x, this.data.sequences);
        })
        .flat();
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
      });
    },
    createFeatures: function(baktaEntry, sequences) {
      const feature = {
        chr: baktaEntry.contig,
        // Bakta coordinates are 1-based closed intervals, but igvjs uses zero based open intervals
        // so we need to transform them here
        start: baktaEntry.start - 1,
        end: baktaEntry.stop,
        strand: baktaEntry.strand,
        type: baktaEntry.type,
        color: this.color(baktaEntry),
      };

      if ("locus" in baktaEntry) feature.locus = baktaEntry.locus || "";
      if ("gene" in baktaEntry) feature.gene = baktaEntry.gene || "";

      if ("product" in baktaEntry) feature.product = baktaEntry.product || "";
      if ("product" in baktaEntry) feature.name = baktaEntry.product || "";
      if ("cds" === baktaEntry.type) {
        const cogs = this.lookupCog(baktaEntry);
        if (cogs.length > 0) feature.cog = cog.lookupCogLabels(cogs);
      }

      // split into two feature when end < start
      if (baktaEntry.stop < baktaEntry.start) {
        const seq = sequences.filter((s) => baktaEntry.contig === s.id)[0];
        return [
          { ...feature, start: feature.start, end: seq.length },
          { ...feature, start: 0, end: feature.end },
        ];
      }
      return feature;
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
