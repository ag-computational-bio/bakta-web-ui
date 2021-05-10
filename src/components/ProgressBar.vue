<template>
  {{ title }}
  <div class="progress">
    <div
      class="progress-bar bg-secondary"
      :class="classes"
      role="progressbar"
      :style="'width: ' + progress.value + '%;'"
      :aria-valuenow="progress.value"
      :aria-valuemin="progress.min"
      :aria-valuemax="progress.max"
    >
      <template v-if="showLabel"> {{ progress.value }} % </template>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    progress: {
      type: Object,
      default: () => ({ min: 0, max: 100, value: 0, type: "static" }),
    },
    title: String,
    showLabel: { type: Boolean, default: false },
  },
  computed: {
    classes: function () {
      if (this.progress.type === "indeterminate") {
        return "progress-bar-striped progress-bar-animated";
      } else {
        return "";
      }
    },
  },
};
</script>

<style>
.progress-bar {
  transition: width 0s ease;
}
</style>