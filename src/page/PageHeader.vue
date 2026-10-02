<template>
  <header>
    <div class="nav-band border-bottom">
      <div class="container">
        <nav-bar :active="page" />
      </div>
    </div>
    <div class="container">
      <bakta-title :version="version" />
    </div>
  </header>
</template>
<script setup lang="ts">
import BaktaTitle from '@/page/BaktaTitle.vue'
import NavBar from '@/page/NavBar.vue'
import type { Version } from '@/model/Version'

withDefaults(
  defineProps<{
    page: string
    version: Version
  }>(),
  {},
)
</script>
<style scoped>
.nav-band {
  background-color: #fff;
}
</style>
