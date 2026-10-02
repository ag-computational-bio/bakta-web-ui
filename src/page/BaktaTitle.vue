<template>
  <div
    class="d-flex flex-wrap justify-content-between align-items-baseline column-gap-4 row-gap-1 pt-3"
  >
    <h1 class="tagline mb-0">
      <span class="visually-hidden">Bakta Web: </span>Rapid &amp; standardized annotation of
      bacterial genomes, MAGs &amp; plasmids
    </h1>
    <p class="version mb-0">
      Bakta {{ version?.baktaVersion ?? 'unknown' }}
      <span class="sep" aria-hidden="true">·</span>
      DB {{ version?.baktaDbVersion ?? 'unknown' }}
      <span class="sep" aria-hidden="true">·</span>
      Baktfold {{ version?.baktfoldVersion ?? 'unknown' }}
    </p>
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
.tagline {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--bs-secondary-color);
}
.version {
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--bs-secondary-color);
}
.sep {
  margin-inline: 0.25rem;
}
</style>
