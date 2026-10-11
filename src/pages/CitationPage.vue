<template>
  <div class="container flex-grow-1">
    <div class="card p-4">
      <h2 class="section-title">Citations</h2>
      <p class="text-secondary">If you use Bakta or Bakta Web in your work, please cite:</p>
      <div class="row g-3">
        <div v-for="c in citations" :key="c.doi" class="col-lg-6">
          <article class="panel h-100">
            <h3 class="subsection-title">{{ c.title }}</h3>
            <p class="mb-1">{{ c.authors }}</p>
            <p class="text-secondary fst-italic mb-2">{{ c.journal }}</p>
            <a :href="`https://doi.org/${c.doi}`" target="_blank" rel="noopener">
              <i class="bi bi-box-arrow-up-right me-1"></i>doi: {{ c.doi }}
            </a>
          </article>
        </div>
      </div>
    </div>

    <div class="card p-4 mt-4">
      <h2 class="section-title">Tools and databases</h2>
      <p class="text-secondary">
        Bakta stands on the shoulders of giants as it takes advantage of many publicly available
        tools &amp; databases. If you find any of those used within Bakta useful, please also cite
        these primary sources.
      </p>
      <div class="row g-4">
        <div
          v-for="group in [
            { title: 'Tools', items: tools },
            { title: 'Databases', items: databases },
          ]"
          :key="group.title"
          class="col-md-6"
        >
          <h3 class="section-label">{{ group.title }}</h3>
          <ul class="list-unstyled mb-0">
            <li
              v-for="s in group.items"
              :key="s.name"
              class="d-flex justify-content-between gap-3 py-2 border-bottom"
            >
              <span>{{ s.name }}</span>
              <a :href="`https://doi.org/${s.doi}`" target="_blank" rel="noopener" class="text-end">
                {{ s.doi }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
type Citation = { title: string; authors: string; journal: string; doi: string }
type Source = { name: string; doi: string }

const citations: Citation[] = [
  {
    title: 'Bakta Web – rapid and standardized genome annotation on scalable infrastructures',
    authors: 'Beyvers S., Jelonek L., Goesmann A., Schwengers O.',
    journal: 'Nucleic Acids Research (2025), gkaf335',
    doi: '10.1093/nar/gkaf335',
  },
  {
    title:
      'Bakta: rapid and standardized annotation of bacterial genomes via alignment-free sequence identification',
    authors: 'Schwengers O., Jelonek L., Dieckmann M. A., Beyvers S., Blom J., Goesmann A.',
    journal: 'Microbial Genomics (2021), 7(11)',
    doi: '10.1099/mgen.0.000685',
  },
]

const tools: Source[] = [
  { name: 'tRNAscan-SE 2.0', doi: '10.1093/nar/gkab688' },
  { name: 'Aragorn', doi: '10.1093/nar/gkh152' },
  { name: 'Infernal', doi: '10.1093/bioinformatics/btt509' },
  { name: 'PilerCR', doi: '10.1186/1471-2105-8-18' },
  { name: 'Prodigal', doi: '10.1186/1471-2105-11-119' },
  { name: 'Diamond', doi: '10.1038/s41592-021-01101-x' },
  { name: 'BLAST+', doi: '10.1186/1471-2105-10-421' },
  { name: 'HMMER', doi: '10.1371/journal.pcbi.1002195' },
  { name: 'AMRFinderPlus', doi: '10.1038/s41598-021-91456-0' },
  { name: 'DeepSig', doi: '10.1093/bioinformatics/btx818' },
]

const databases: Source[] = [
  { name: 'Rfam', doi: '10.1002/cpbi.51' },
  { name: 'Mob-suite', doi: '10.1099/mgen.0.000206' },
  { name: 'DoriC', doi: '10.1093/nar/gky1014' },
  { name: 'AntiFam', doi: '10.1093/database/bas003' },
  { name: 'UniProt', doi: '10.1093/nar/gky1049' },
  { name: 'RefSeq', doi: '10.1093/nar/gkx1068' },
  { name: 'COG', doi: '10.1093/bib/bbx117' },
  { name: 'AMRFinder', doi: '10.1128/AAC.00483-19' },
  { name: 'ISFinder', doi: '10.1093/nar/gkj014' },
  { name: 'Pfam', doi: '10.1093/nar/gky995' },
  { name: 'VFDB', doi: '10.1093/nar/gky1080' },
]
</script>
