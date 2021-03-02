<template>
  <page-header page="Download" />
  <div class="page-body">
    <div class="container">
      <div class="row">
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Local version</h4>
              <ul class="card-text list-unstyled">
                <li>
                  <a href="https://github.com/oschwengers/bakta#installation">
                    <shield icon="bi-globe" rightclass="bg-light text-dark">
                      Installation instructions
                    </shield>
                  </a>
                </li>
                <li>
                  <a href="https://anaconda.org/bioconda/bakta">
                    <img
                      src="https://img.shields.io/conda/v/bioconda/bakta.svg"
                    />
                  </a>
                </li>
                <li>
                  <a href="https://hub.docker.com/r/oschwengers/bakta">
                    <shield icon="bi-globe" rightclass="bg-light text-dark">
                      Docker
                    </shield>
                  </a>
                </li>
                <li>
                  <a href="https://github.com/oschwengers/bakta">
                    <img
                      src="https://img.shields.io/github/release/oschwengers/bakta.svg"
                    />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="card no-border h-100">
            <div class="card-body">
              <h4 class="card-title">Database</h4>
              <p class="card-text">
                <a href="https://doi.org/10.5281/zenodo.4247252">
                  <img
                    src="https://zenodo.org/badge/DOI/10.5281/zenodo.4247252.svg"
                  />
                </a>
              </p>
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
import Shield from "@/components/Shield";
export default {
  name: "Download",
  components: { PageHeader, PageFooter, Shield },
};
</script>
<style scoped>
.shield {
  font-size: 1.3em;
}
</style>