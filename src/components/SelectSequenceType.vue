<template>
  <select
    class="form-select"
    ref="select"
    :id="id"
    @change="emitChange($event.srcElement.value)"
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
        { value: "chromosome", label: "Chromosome" },
        { value: "plasmid", label: "Plasmid" },
        { value: "contig", label: "Contig" },
      ],
    };
  },
  props: {
    complete: { type: Boolean, default: false },
    def: {
      type: String,
      default: "contig",
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
          return "chromosome";
        } else {
          return this.def;
        }
      }
    },
  },
  methods: {
    emitChange(newValue) {
      this.$emit("update:modelValue", newValue);
    },
  },
  emits: ["update:modelValue"],
};
</script>
