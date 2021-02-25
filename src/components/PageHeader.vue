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
      //"version": {"bakta":"v0.5", "database": "v1.1"}
    };
  },
  props: {
    page: {
      type: String,
      default: "",
    },
    version: {
      type: Object,
      default: function () {
        return { bakta: "v0.5", database: "v1.1" };
      },
    },
  },
};
</script>
