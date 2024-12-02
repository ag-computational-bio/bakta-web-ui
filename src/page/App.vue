<template>
  <div class="d-flex flex-column page">
    <PageHeader :page="routeName" :version="version" />
    <router-view />
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
import { type Version } from '@/model/Version'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageFooter from './PageFooter.vue'
import PageHeader from './PageHeader.vue'
import { useBaktaApi } from '@/model/bakta-api'

const route = useRoute()
const routeName = computed<string>(() => {
  if (typeof route.name === 'string') return route.name
  return 'unknown'
})

const version = ref<Version>({ toolVersion: 'unknown', dbVersion: 'unknown' })
const bakta = useBaktaApi()
onMounted(() => {
  bakta
    .getVersions()
    .then((x) => (version.value = x))
    .catch()
})
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
