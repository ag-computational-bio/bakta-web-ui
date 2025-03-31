<template>
  <div class="page-body flex-grow-1">
    <div class="container">
      <h2>General</h2>
      <p>
        Bakta is a tool for the rapid &amp; standardized annotation of bacterial genomes and
        plasmids from both isolates and MAGs.
      </p>
      <p>
        This service provides web-based access to the underlying commandline tool. All information
        that is given below refers to this web service. Information regarding the commandline tool
        are provided via <a href="https://github.com/oschwengers/bakta" target="_blank">GitHub</a>.
      </p>
      <h2>Terms of use</h2>
      <ul>
        <li>
          General contact and questions:
          <a href="mailto:bakta@computational.bio.uni-giessen.de"
            >bakta@computational.bio.uni-giessen.de</a
          >
        </li>
        <li>
          Technical issues and bug reports:
          <a href="https://github.com/ag-computational-bio/bakta-web-ui/issues"
            >https://github.com/ag-computational-bio/bakta-web-ui/issues</a
          >
        </li>
        <li>License: GPL-3</li>
        <li>
          Fair Use Policy: As there are no technical rate limitations implemented, we kindly ask all
          users to act responsibly and with due respect.
        </li>
        <li>
          Data protection and level of security:
          <a href="https://www.uni-giessen.de/fbz/fb08/Inst/bioinformatik/bcf/data-privacy"
            >https://www.uni-giessen.de/fbz/fb08/Inst/bioinformatik/bcf/data-privacy</a
          >
          All data transfer is conducted via HTTPS and secured end-to-end via TLS. Data stored on
          our system is accessible only by bakta maintainers and automatically deleted after 30
          days. This service is not recommended for confidential, sensitive or personal data. In
          case you would like to analyze such data, please consider using the local CLI Bakta
          version.
        </li>
        <li>
          We believe in data minimization for this service and store only essential data on our
          servers. That comprises a unique access token, input files and results for each job. For
          data access, a list of jobs is solely saved in your browser. We do not use cookies for
          this service.
        </li>
        <li>
          Waranty: The service providers do not express or imply any warranty. The service providers
          are neither responsible for decisions that are made based on the output of this service
          nor assume any liability for damages that may result from using this service.
        </li>
        <li>Terms of Use document: <a href="/tou.md" target="_blank">ToU</a></li>
        <li>
          Service evaluation:
          <a href="https://www.surveymonkey.de/r/denbi-service?sc=bigi&tool=bakta" target="_blank"
            >https://www.surveymonkey.de/r/denbi-service?sc=bigi&tool=bakta</a
          >
        </li>
        <li>
          <a href="/citation">Citation</a>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.shield {
  font-size: 1.3em;
}
</style>
