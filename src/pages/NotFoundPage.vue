<template>
  <div class="container">
    <div class="alert alert-danger">
      <h2 class="h5">Page not found: {{ route.fullPath }}</h2>
      <RouterLink to="/">Back to the start page</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
