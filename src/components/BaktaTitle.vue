<template>
<div>
    <h1>Bakta Web<span class="float-end version">({{ version.bakta }}|{{ version.database }})</span></h1>
    <h3>Rapid &amp; standardized annotation of bacterial genomes &amp; plasmids</h3>
</div>
</template>
<script>
export default {
  name: 'BaktaTitle',
    props: {
    version: Object
  }
}
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