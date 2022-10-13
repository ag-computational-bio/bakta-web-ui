<template>
  <page-header page="About" />
  <div class="page-body flex-grow-1 ">
    <div class="container">
      <h2>General</h2>
      <p>
        Bakta is a tool for the rapid &amp; standardized annotation of bacterial genomes and plasmids from both isolates and MAGs.
      </p>
      <p>
        This service provides web-based access to the underlying commandline tool. All information that is given below refers to this web service. Information regarding the commandline tool are provided via <a href="https://github.com/oschwengers/bakta" target="_blank">GitHub</a>.
      </p>
      <h2>Terms of use</h2>
      <p>
        <ul>
            <li>
                General contact and questions: <a href="mailto:bakta@computational.bio.uni-giessen.de">bakta@computational.bio.uni-giessen.de</a>
            </li>
            <li>
                Technical issues and bug reports: <a href="https://github.com/ag-computational-bio/bakta-web-ui/issues">https://github.com/ag-computational-bio/bakta-web-ui/issues</a>
            </li>
            <li>
                License: GPL-3
            </li>
            <li>
                Data protection: <a href="https://www.uni-giessen.de/fbz/fb08/Inst/bioinformatik/bcf/data-privacy">https://www.uni-giessen.de/fbz/fb08/Inst/bioinformatik/bcf/data-privacy</a>
                All input data is stored on our servers and automatically removed after 30 days.
            </li>
            <li>
                Terms of Use document: <a href="/tou.md" target="_blank">ToU</a>
            </li>
            <li>
                Service evaluation: <a href="https://www.surveymonkey.de/r/denbi-service?sc=hd-hub&tool=band" target="_blank">https://www.surveymonkey.de/r/denbi-service?sc=hd-hub&tool=band</a>
            </li>
            <li>
                <a href="/citation">Citation</a>
            </li>
        </ul>
      </p>
    </div>
  </div>
  <page-footer />
</template>
<script>
import PageHeader from "@/components/PageHeader";
import PageFooter from "@/components/PageFooter";
export default {
  name: "About",
  components: { PageHeader, PageFooter},
};
</script>
<style scoped>
.shield {
  font-size: 1.3em;
}
</style>