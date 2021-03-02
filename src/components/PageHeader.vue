<template>
  <div class="container">
    <nav-bar :active="page" />
    <bakta-title :version="version" />
  </div>
</template>
<script>
import BaktaTitle from "@/components/BaktaTitle.vue";
import NavBar from "@/components/NavBar.vue";

export default {
  name: "PageHeader",
  components: {
    BaktaTitle,
    NavBar,
  },
  data: function () {
    return {
      "version": null
    };
  },
  mounted: function() {
    let vm = this
    this.$bakta.version().then(x => vm.version = x) 
  },
  props: {
    page: {
      type: String,
      default: "",
    }
  },
};
</script>
