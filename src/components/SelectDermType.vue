<template>
  <select
    class="form-select"
    :id="id"
    @change="$emit('update:modelValue', $event.srcElement.value)"
    :value="modelValue"
  >
    <option
      v-for="item in options"
      :selected="item.value === def ? true : false"
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
        { value: "MONODERM", label: "Monoderm" },
        { value: "DIDERM", label: "Diderm" },
      ],
    };
  },
  props: {
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
  emits: ["update:modelValue"],
};
</script>
