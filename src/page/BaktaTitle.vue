<template>
  <div>
    <h1>
      Bakta Web
      <span class="float-end version">
        Bakta {{ version?.baktaVersion ?? 'unknown' }} | DB
        {{ version?.baktaDbVersion ?? 'unknown' }} | Baktfold
        {{ version?.baktfoldVersion ?? 'unknown' }}
      </span>
    </h1>
    <h3>Rapid &amp; standardized annotation of bacterial genomes, MAGs &amp; plasmids</h3>
  </div>
</template>
<script setup lang="ts">
import type { Version } from '@/model/Version'

withDefaults(
  defineProps<{
    version: Version
  }>(),
  {},
)
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
