<template>
<div class="container">
  <nav-bar active="Download"/>
  <bakta-title :version="version"/>
</div>
</template>

<script>
import BaktaTitle from './components/BaktaTitle.vue'
import NavBar from './components/NavBar.vue'

export default {
  name: 'App',
  components: {
    BaktaTitle,
    NavBar
  },
  data: function() {
    return {
      "version": {"bakta":"v0.5", "database": "v1.1"}
    }
  }
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
