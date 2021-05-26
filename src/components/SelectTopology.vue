<template>
  <select
    class="form-select"
    :id="id"
    @change="$emit('update:modelValue', $event.srcElement.value)"
    :value="modelValue"
  >
    <option
      v-for="item in visibleOptions"
      :selected="item.value === selectedOption ? true : false"
      :key="item.value"
      :value="item.value"
    >
      {{ item.label }}
    </option>
  </select>
</template>
<script>
export default {
  data() {
    return {
      options: [
        { value: "UNKNOWN", label: "?" },
        { value: "c", label: "circular" },
        { value: "l", label: "linear" },
      ],
    };
  },
  props: {
    complete: { type: Boolean, default: false },
    def: {
      type: String,
      default: "UNKNOWN",
    },
    id: {
      type: String,
      default: "",
    },
    modelValue: { type: String },
  },
  computed: {
    visibleOptions() {
      if (this.complete) {
        return this.options.slice(1, 3);
      }
      return this.options;
    },
    selectedOption() {
      if (this.options.some((x) => x.value === this.modelValue)) {
        return this.modelValue;
      } else {
        if (this.complete) {
          return "c";
        } else {
          return this.def;
        }
      }
    },
  },
  emits: ["update:modelValue"],
};
</script>
