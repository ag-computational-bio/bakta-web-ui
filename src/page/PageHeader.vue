<template>
  <header class="border-bottom">
    <div class="container position-relative">
      <nav-bar :active="page" />
      <p v-if="version" class="version">
        Bakta {{ version.baktaVersion }} <span aria-hidden="true">·</span> DB
        {{ version.baktaDbVersion }} <span aria-hidden="true">·</span> Baktfold
        {{ version.baktfoldVersion }}
      </p>
    </div>
  </header>
</template>
<script setup lang="ts">
import NavBar from '@/page/NavBar.vue'
import type { Version } from '@/model/Version'

withDefaults(
  defineProps<{
    page: string
    version?: Version
  }>(),
  {},
)
</script>
<style scoped>
/*
 * The version sits right below the divider line, in the top right. It is
 * positioned absolutely, so it does not take space from the page content.
 */
.version {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: calc(var(--bs-gutter-x) * 0.5);
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--bs-secondary-color);
}
</style>
