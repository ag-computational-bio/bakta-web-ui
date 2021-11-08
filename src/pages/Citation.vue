<template>
  <page-header page="Citation" />
  <div class="page-body flex-grow-1 ">
    <div class="container">
      <div class="row">
        <div class="card no-border h-100">
          <div class="card-body">
            <h4 class="card-title">Citation</h4>
            <ul class="card-text list-unstyled">
              <pre>
              Schwengers O., Jelonek L., Dieckmann M. A., Beyvers S., Blom J., Goesmann A. (2021).
              Bakta: rapid and standardized annotation of bacterial genomes via alignment-free sequence identification.
              Microbial Genomics, 7(11). <a href="https://doi.org/10.1099/mgen.0.000685" target="_blank">10.1099/mgen.0.000685</a>
              </pre>
            </ul>
          </div>
        </div>
      </div>
      <div class="row">
        Bakta is standing on the shoulder of giants taking advantage of many publicly available databases. If you find any of those used within Bakta useful, please also cite these primary sources.
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Tools</h4>
              <ul class="card-text list-unstyled">
                <li>
                  tRNAscan-SE 2.0 (<a href="https://doi.org/10.1093/nar/gkab688" target="_blank">10.1093/nar/gkab688</a>)
                </li>
                <li>
                  Aragorn (<a href="https://doi.org/10.1093/nar/gkh152" target="_blank">10.1093/nar/gkh152</a>)
                </li>
                <li>
                  Infernal (<a href="https://doi.org/10.1093/bioinformatics/btt509" target="_blank">10.1093/bioinformatics/btt509</a>)
                </li>
                <li>
                  PilerCR (<a href="https://doi.org/10.1186/1471-2105-8-18" target="_blank">10.1186/1471-2105-8-18</a>)
                </li>
                <li>
                  Prodigal (<a href="https://doi.org/10.1186/1471-2105-11-119" target="_blank">10.1186/1471-2105-11-119</a>)
                </li>
                <li>
                  Diamond (<a href="https://doi.org/10.1038/s41592-021-01101-x" target="_blank">10.1038/s41592-021-01101-x</a>)
                </li>
                <li>
                  BLAST+ (<a href="https://doi.org/10.1186/1471-2105-10-421" target="_blank">10.1186/1471-2105-10-421</a>)
                </li>
                <li>
                  HMMER (<a href="https://doi.org/10.1371/journal.pcbi.1002195" target="_blank">10.1371/journal.pcbi.1002195</a>)
                </li>
                <li>
                  AMRFinderPlus (<a href="https://doi.org/10.1038/s41598-021-91456-0" target="_blank">10.1038/s41598-021-91456-0</a>)
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Databases</h4>
              <ul class="card-text list-unstyled">
                <li>
                  Rfam (<a href="https://doi.org/10.1002/cpbi.51" target="_blank">10.1002/cpbi.51</a>)
                </li>
                <li>
                  Mob-suite (<a href="https://doi.org/10.1099/mgen.0.000206" target="_blank">10.1099/mgen.0.000206</a>)
                </li>
                <li>
                  DoriC (<a href="https://doi.org/10.1093/nar/gky1014" target="_blank">10.1093/nar/gky1014</a>)
                </li>
                <li>
                  AntiFam (<a href="https://doi.org/10.1093/database/bas003" target="_blank">10.1093/database/bas003</a>)
                </li>
                <li>
                  UniProt (<a href="https://doi.org/10.1093/nar/gky1049" target="_blank">10.1093/nar/gky1049</a>)
                </li>
                <li>
                  RefSeq (<a href="https://doi.org/10.1093/nar/gkx1068" target="_blank">10.1093/nar/gkx1068</a>)
                </li>
                <li>
                  COG (<a href="https://doi.org/10.1093/bib/bbx117" target="_blank">10.1093/bib/bbx117</a>)
                </li>
                <li>
                  AMRFinder (<a href="https://doi.org/10.1128/AAC.00483-19" target="_blank">10.1128/AAC.00483-19</a>)
                </li>
                <li>
                  ISFinder (<a href="https://doi.org/10.1093/nar/gkj014" target="_blank">10.1093/nar/gkj014</a>)
                </li>
                <li>
                  Pfam (<a href="https://doi.org/10.1093/nar/gky995" target="_blank">10.1093/nar/gky995</a>)
                </li>
                <li>
                  VFDB (<a href="https://doi.org/10.1093/nar/gky1080" target="_blank">10.1093/nar/gky1080</a>)
                </li>
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
import PageFooter from "@/components/PageFooter";
export default {
  name: "Citation",
  components: { PageHeader, PageFooter },
};
</script>
<style scoped>
.shield {
  font-size: 1.3em;
}
</style>