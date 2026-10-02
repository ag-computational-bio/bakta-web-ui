<template>
  <nav class="navbar navbar-expand-md px-0">
    <router-link to="/" class="navbar-brand d-flex align-items-center gap-2 me-4">
      <img src="/bakta.svg" alt="" width="34" height="34" />
      <span class="brand-name">Bakta <span class="brand-suffix">Web</span></span>
    </router-link>
    <button
      class="navbar-toggler border-0"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto gap-md-1">
        <li v-for="item in nav" :key="item.label" class="nav-item">
          <router-link
            v-if="item.local"
            :to="item.href"
            class="nav-link"
            :class="{ active: item.active }"
          >
            {{ item.label }}
          </router-link>
          <a v-else class="nav-link" target="_blank" rel="noopener" :href="item.href">
            {{ item.label }}<i class="bi bi-box-arrow-up-right external" aria-hidden="true"></i>
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    active: string
  }>(),
  {},
)

const navElements = ref([
  { label: 'Submit', href: '/submit', local: true },
  { label: 'Jobs', href: '/jobs', local: true },
  { label: 'Viewer', href: '/viewer', local: true },
  { label: 'Citation', href: '/citation', local: true },
  { label: 'Docs', href: 'https://bakta.readthedocs.io/', local: false },
  { label: 'CLI', href: 'https://github.com/oschwengers/bakta', local: false },
  { label: 'About', href: '/about', local: true },
])

const nav = computed(() => {
  const nav = []
  for (const i of navElements.value) {
    nav.push({
      label: i.label,
      href: i.href,
      active: i.label === props.active,
      local: i.local,
    })
  }
  return nav
})
</script>
<style scoped>
.brand-name {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.brand-suffix {
  font-weight: 400;
  color: var(--bs-secondary-color);
}
.nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: var(--bs-border-radius);
  color: var(--bs-body-color);
  transition:
    background-color 0.15s,
    color 0.15s;
}
.nav-link:hover {
  background-color: var(--bakta-surface);
}
.nav-link.active {
  font-weight: 600;
  color: var(--bs-primary-text-emphasis);
  background-color: var(--bs-primary-bg-subtle);
}
.external {
  margin-left: 0.3rem;
  font-size: 0.65em;
  opacity: 0.55;
}
</style>
