<template>
  <div class="d-flex flex-column page">
    <PageHeader :page="routeName" :version="version" />
    <main class="flex-grow-1 page-main">
      <router-view />
    </main>
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

const version = ref<Version>({
  backendVersion: 'unknown',
  baktaVersion: 'unknown',
  baktaDbVersion: 'unknown',
  baktfoldVersion: 'unknown',
  baktfoldDbVersion: 'unknown',
})
const bakta = useBaktaApi()
onMounted(() => {
  bakta
    .getVersions()
    .then((x) => (version.value = x))
    .catch()
})
</script>
