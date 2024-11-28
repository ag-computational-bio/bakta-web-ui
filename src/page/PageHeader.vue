<template>
  <div class="container">
    <nav-bar :active="page" />
    <bakta-title :version="version" />
  </div>
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
