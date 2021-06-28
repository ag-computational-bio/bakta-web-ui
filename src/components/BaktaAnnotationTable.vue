<template>
  <datatable
    :columns="columns"
    :dataSet="table"
    :configuration="dataTableConfig"
  />
</template>

<script>
import Datatable from "@/components/Datatable.vue";
import $ from "jquery";

export default {
  name: "BaktaResultView",
  components: { Datatable },
  props: {
    data: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    table: function() {
      return this.data.features.map((x) => ({
        contig: x.contig || "",
        type: x.type || "",
        start: x.start || "",
        stop: x.stop || "",
        strand: x.strand || "",
        locus: x.locus || "",
        product: x.product || "",
        dbxrefs: x.db_xrefs
          ? x.db_xrefs
              // url is hard coded for the moment. Should be moved to rest-api module
              .map(
                (x) =>
                  '<a target="_" href=https://psos-staging.computational.bio/api/v1/dbxref/redirect/' +
                  x +
                  ">" +
                  x +
                  "</a>"
              )
              .join("<br> ")
          : "",
      }));
    },
  },
  data: function() {
    return {
      dataTableConfig: {
        scrollY: "70vh",
        scrollCollapse: true,
        paging: true,
        pageLength: 100,
        processing: true,
        deferRender: true,
        lengthMenu: [50, 100, 250],
      },

      columns: [
        {
          data: "contig",
          title: "Sequence",
          render: $.fn.dataTable.render.text(),
        },
        { data: "type", title: "Type", render: $.fn.dataTable.render.text() },
        { data: "start", title: "Start", render: $.fn.dataTable.render.text() },
        { data: "stop", title: "Stop", render: $.fn.dataTable.render.text() },
        {
          data: "strand",
          title: "Strand",
          render: $.fn.dataTable.render.text(),
        },
        {
          data: "locus",
          title: "Locus tag",
          render: $.fn.dataTable.render.text(),
        },
        {
          data: "product",
          title: "Product",
          render: $.fn.dataTable.render.text(),
        },
        { data: "dbxrefs", title: "DbXrefs" },
      ],
    };
  },
  methods: {},
  mounted: function() {},
};
</script>
<style scoped></style>
