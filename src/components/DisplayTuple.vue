<template>
  <div class="row">
    <div class="label" :class="labelClass">{{ label }}</div>
    <div class="value" :class="valueClass">{{ value }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    break: { type: Number, default: 4 },
  },
  computed: {
    labelClass: function () {
      return "col-md-" + this.break;
    },
    valueClass: function () {
      return "col-md-" + (12 - this.break);
    },
  },
};
</script>

<style>
.label {
  font-weight: bold;
}
.value {
  font-weight: bold;
  color: gray;
}
</style>