<template>
  <div class="container">
    <page-header></page-header>
    <div class="container-fluid">
      <div class="alert alert-danger">
        <h5>Page not found: {{ $route.fullPath }}</h5>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from "../components/PageHeader.vue";

export default {
  name: "App",
  components: {
    PageHeader,
  },
};
</script>
