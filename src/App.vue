<template>
  <div class="d-flex flex-column page">
    <page-header :page="route.name" />
    <router-view />
    <page-footer />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
<style>
.page {
  min-height: 100%;
}
.page-body {
  padding-top: 3em;
}
.no-border {
  border-color: #00000000;
}
body,
html {
  height: 100%;
}
#app {
  height: 100%;
}
h4 {
  color: gray;
}
h5 {
  color: gray;
}
h6 {
  color: gray;
}
.value {
  font-weight: bold;
  color: gray;
}
</style>
