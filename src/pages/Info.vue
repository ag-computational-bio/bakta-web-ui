<template>
  <page-header page="Info" />
  <div class="page-body">
    <div class="container">
      <div class="row">
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Annotated feature types</h4>
              <ul class="card-text">
                <li>tRNA</li>
                <li>tmRNA</li>
                <li>rRNA</li>
                <li>ncRNA</li>
                <li>ncRNA cis-reg regions</li>
                <li>CRISPR</li>
                <li>sORF</li>
                <li>oriC/V &amp; oriT</li>
                <li>gaps</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Included DBs</h4>
              <ul class="card-text">
                <li>Rfam</li>
                <li>UniProt UniRef100/UniRef90</li>
                <li>UniProtKB/SwissProt</li>
                <li>NCBI non-redundant proteins</li>
                <li>NCBI AMRFinderPlus</li>
                <li>ISFinder</li>
                <li>MOB-suite</li>
                <li>DoriC</li>
                <li>COG</li>
                <li>Pfam</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter.vue";
export default {
  name: "Info",
  components: { PageHeader, PageFooter },
};
</script>
<style scoped>
</style>