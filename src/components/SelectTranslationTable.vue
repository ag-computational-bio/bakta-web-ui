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
    def: { type: Number, default: 1 },
    modelValue: { type: Number },
  },
  methods: {

  },
  emits: ['update:modelValue'],
  data: function () {
    return {
      options: [
        { value: "1", label: "The Standard Code" },
        { value: "2", label: "The Vertebrate Mitochondrial Code" },
        { value: "3", label: "The Yeast Mitochondrial Code" },
        {
          value: "4",
          label:
            "The Mold, Protozoan, and Coelenterate Mitochondrial Code and the Mycoplasma/Spiroplasma Code",
        },
        { value: "5", label: "The Invertebrate Mitochondrial Code" },
        {
          value: "6",
          label: "The Ciliate, Dasycladacean and Hexamita Nuclear Code",
        },
        {
          value: "9",
          label: "The Echinoderm and Flatworm Mitochondrial Code",
        },
        { value: "10", label: "The Euplotid Nuclear Code" },
        {
          value: "11",
          label: "The Bacterial, Archaeal and Plant Plastid Code",
        },
        { value: "12", label: "The Alternative Yeast Nuclear Code" },
        { value: "13", label: "The Ascidian Mitochondrial Code" },
        { value: "14", label: "The Alternative Flatworm Mitochondrial Code" },
        { value: "16", label: "Chlorophycean Mitochondrial Code" },
        { value: "21", label: "Trematode Mitochondrial Code" },
        { value: "22", label: "Scenedesmus obliquus Mitochondrial Code" },
        { value: "23", label: "Thraustochytrium Mitochondrial Code" },
        { value: "24", label: "Rhabdopleuridae Mitochondrial Code" },
        {
          value: "25",
          label: "Candidate Division SR1 and Gracilibacteria Code",
        },
        { value: "26", label: "Pachysolen tannophilus Nuclear Code" },
        { value: "27", label: "Karyorelict Nuclear Code" },
        { value: "28", label: "Condylostoma Nuclear Code" },
        { value: "29", label: "Mesodinium Nuclear Code" },
        { value: "30", label: "Peritrich Nuclear Code" },
        { value: "31", label: "Blastocrithidia Nuclear Code" },
        { value: "33", label: "Cephalodiscidae Mitochondrial UAA-Tyr Code" },
      ],
    };
  },
};
</script>