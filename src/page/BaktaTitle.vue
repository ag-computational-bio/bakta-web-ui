<template>
  <div>
    <h1>
      Bakta Web
      <span class="float-end version"> ({{ versionString }}) </span>
    </h1>
    <h3>Rapid &amp; standardized annotation of bacterial genomes, MAGs &amp; plasmids</h3>
  </div>
</template>
<script setup lang="ts">
import type { Version } from '@/model/Version'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    version: Version
  }>(),
  {},
)

const versionString = computed(() => {
  const toolVersion = props.version?.toolVersion ?? 'unknown'
  const dbVersion = props.version?.dbVersion ?? 'unknown'
  return `Software: ${toolVersion}| DB: ${dbVersion}`
})
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
