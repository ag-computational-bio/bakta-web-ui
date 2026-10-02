<template>
  <div class="container">
    <div class="alert alert-danger">
      <h2 class="h5 mb-0">Page not found: {{ route.fullPath }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
