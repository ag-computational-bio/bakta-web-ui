<template>
  <div class="container">
    <div class="container-fluid">
      <div class="alert alert-danger">
        <h5>Page not found: {{ route.fullPath }}</h5>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
