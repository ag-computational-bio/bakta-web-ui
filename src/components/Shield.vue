<template>
  <span class="shield">
    <span :class="leftClass">
      <span :class="iconClass"></span>
    </span>
    <span :class="rightClass">
      <slot></slot>
    </span>
  </span>
</template>
<script>
export default {
  name: "Shield",
  props: {
    icon: { type: String, default: "bi-globe" },
    leftclass: { type: String, default: "bg-secondary" },
    rightclass: { type: String, default: "bg-success" },
  },
  computed: {
    leftClass() {
      return "badge left " + this.leftclass;
    },
    rightClass() {
      return "badge right " + this.rightclass;
    },
    iconClass() {
      return "bi " + this.icon;
    },
  },
};
</script>
<style scoped>
.shield {
}
.shield .left {
  border-radius: 0.25rem 0rem 0rem 0.25rem;
}
.shield .right {
  border-radius: 0rem 0.25rem 0.25rem 0rem;
}
</style>