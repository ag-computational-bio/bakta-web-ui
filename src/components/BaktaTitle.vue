<template>
  <div>
    <h1>
      Bakta Web
      <span class="float-end version"> ({{ versionString }}) </span>
    </h1>
    <h3>
      Rapid &amp; standardized annotation of bacterial genomes &amp; plasmids
    </h3>
  </div>
</template>
<script>
export default {
  name: "BaktaTitle",
  props: {
    version: Object,
    default: { toolVersion: "unknown", dbVersion: "unknown" },
  },
  computed: {
    versionString: function() {
      const toolVersion = this.version ? this.version.toolVersion : "unknown";
      const dbVersion = this.version ? this.version.dbVersion : "unknown";
      return `Bakta-Version: ${toolVersion}| BaktaDB-Version: ${dbVersion}`;
    },
  },
};
</script>
<style scoped>
h1 {
  text-align: left;
  font-weight: bold;
}
h3 {
  text-align: left;
  color: gray;
}
.version {
  font-size: 0.3em;
  color: gray;
  padding-right: 1.5em;
}
</style>
