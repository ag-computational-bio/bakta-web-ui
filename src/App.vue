<template>
  <div class="d-flex flex-column page">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
};
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
</style>
