<template>
  <footer class="border-top">
    <div class="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-4">
      <a href="http://www.computational.bio/" target="_blank" rel="noopener">
        <img src="@/assets/logo-cb.svg" alt="Computational Biology" class="logo-cb" />
      </a>
      <a href="http://www.denbi.de/" target="_blank" rel="noopener">
        <img src="@/assets/logo-denbi.svg" alt="deNBI" class="logo-denbi" />
      </a>
    </div>
  </footer>
</template>
<script setup lang="ts"></script>
<style scoped>
img {
  display: block;
  opacity: 0.85;
  transition: opacity 0.15s;
}
a:hover img {
  opacity: 1;
}
.logo-cb {
  height: 72px;
}
.logo-denbi {
  height: 40px;
}
</style>
