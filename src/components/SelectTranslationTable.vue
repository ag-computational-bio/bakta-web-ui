<template>
  <select class="form-select" :id="id" @change="$emit('update:modelValue', parseInt($event.srcElement.value))" :value="modelValue">
    <option
      v-for="item in options"
      :selected="item.value === def ? true : false"
      :key="item.value"
      :value="item.value"
    >
      {{ item.value }}: {{ item.label }}
    </option>
  </select>
</template>
<script>
export default {
  name: "SelectTranslationTable",
  props: {
    id: { type: String, default: "" },
    def: { type: Number, default: 11 },
    modelValue: { type: Number },
  },
  methods: {

  },
  emits: ['update:modelValue'],
  data: function () {
    return {
      options: [
        {
          value: "4",
          label:
            "The Mold, Protozoan, and Coelenterate Mitochondrial Code and the Mycoplasma/Spiroplasma Code",
        },
        {
          value: "11",
          label: "The Bacterial, Archaeal and Plant Plastid Code",
        },

      ],
    };
  },
};
</script>