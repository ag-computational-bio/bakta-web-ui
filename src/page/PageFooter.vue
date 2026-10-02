<template>
  <footer class="site-footer border-top">
    <div class="container">
      <div class="footer-top">
        <a
          class="logo-link logo-start"
          href="https://www.uni-giessen.de/de/fbz/fb08/Inst/bioinformatik/compbio"
          target="_blank"
          rel="noopener"
        >
          <img
            class="logo-cb"
            src="@/assets/logo-cb.svg"
            alt="Computational Biology"
            width="80"
            height="80"
          />
        </a>
        <p class="notice">
          <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
          This service is open to everyone and can be used free of charge. Bakta Web is open source
          software (GPL-3), the code is available on
          <a
            href="https://github.com/ag-computational-bio/bakta-web-ui"
            target="_blank"
            rel="noopener"
            >GitHub</a
          >. For more details see the <RouterLink to="/about">terms of use</RouterLink>.
        </p>
        <a class="logo-link logo-end" href="https://www.denbi.de/" target="_blank" rel="noopener">
          <img class="logo-denbi" src="@/assets/logo-denbi.svg" alt="deNBI" height="36" />
        </a>
      </div>
      <div class="footer-bottom">
        <ul class="footer-links">
          <li><RouterLink to="/about">About</RouterLink></li>
          <li><RouterLink to="/citation">Citation</RouterLink></li>
          <li><RouterLink to="/info">Features &amp; databases</RouterLink></li>
          <li>
            <a href="https://bakta.readthedocs.io/" target="_blank" rel="noopener">Docs</a>
          </li>
          <li>
            <a
              href="https://github.com/ag-computational-bio/bakta-web-ui/issues"
              target="_blank"
              rel="noopener"
              >Report an issue</a
            >
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts"></script>
<style scoped>
.site-footer {
  background-color: var(--bakta-surface);
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
}
.footer-top {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 2rem;
  padding-block: 1.5rem;
}
.notice {
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}
.notice a {
  color: var(--bs-link-color);
  text-decoration: underline;
}
.logo-link {
  display: block;
  opacity: 0.9;
  transition: opacity 0.15s;
}
.logo-link:hover {
  opacity: 1;
}
.logo-link img {
  display: block;
  width: auto;
}
.logo-cb {
  height: 80px;
}
.logo-denbi {
  height: 36px;
}
.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  padding-block: 1rem;
  border-top: 1px solid var(--bs-border-color);
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.footer-links a {
  color: inherit;
  text-decoration: none;
}
.footer-links a:hover {
  color: var(--bs-link-color);
  text-decoration: underline;
}
@media (max-width: 767.98px) {
  .footer-top {
    grid-template-columns: 1fr 1fr;
    row-gap: 1.25rem;
  }
  .notice {
    grid-column: 1 / -1;
    max-width: none;
    text-align: left;
  }
  .logo-start {
    grid-row: 2;
    justify-self: center;
  }
  .logo-end {
    grid-row: 2;
    justify-self: center;
  }
}
</style>
