<template>
  <table
    ref="table"
    :id="tableId"
    class="table table-striped"
    style="width: 100%"
  ></table>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import Datatable from "datatables.net";
import $ from "jquery";
import "@/external/dataTables.bootstrap5.min.js";
import "@/external/dataTables.bootstrap5.min.css";

export default {
  props: {
    tableId: { type: String, default: "datatable" },
    dataSet: { type: Array, default: () => [{ data: "demo" }] },
    columns: {
      type: Array,
      default: () => [{ title: "HEADER", data: "data" }],
    },
    configuration: {
      type: Object,
      default: () => ({}),
    },
  },
  data: function() {
    return {
      datatable: null,
    };
  },
  mounted: function() {
    this.initTable();
  },
  unmounted: function() {
    this.destroyTable();
  },
  methods: {
    destroyTable: function() {
      this.datatable.destroy();
      this.datatable = null;
    },
    initTable: function() {
      if (this.columns || this.dataSet) {
        const config = { ...this.configuration };
        config.data = this.dataSet;
        config.columns = this.columns;

        this.datatable = $("#" + this.tableId).DataTable(config);
      }
    },
    reloadData: function() {
      this.datatable.clear();
      this.datatable.rows.add(this.dataSet);
      this.datatable.draw();
    },
  },
  watch: {
    dataSet: function() {
      this.reloadData();
    },
    columns: function() {
      this.destroyTable();
      this.initTable();
    },
  },
};
</script>

<style></style>
