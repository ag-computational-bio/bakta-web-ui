<template>
  <nav class="navbar navbar-expand-lg px-0 py-3">
    <router-link to="/" class="navbar-brand d-flex align-items-center gap-3 py-0">
      <img class="brand-logo" src="/bakta.svg" alt="" width="52" height="52" />
      <BaktaTitle />
    </router-link>
    <button
      class="navbar-toggler"
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
      <ul class="navbar-nav ms-auto">
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
import BaktaTitle from './BaktaTitle.vue'

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
.navbar-brand {
  min-width: 0;
  margin-right: 0;
  white-space: normal;
}
.navbar-toggler {
  flex: none;
  border-color: var(--bs-border-color);
}
.nav-link {
  position: relative;
  padding: 0.5rem 0;
  font-weight: 500;
  color: var(--bs-secondary-color);
  transition: color 0.15s;
}
.nav-link:hover {
  color: var(--bs-body-color);
}
.nav-link.active {
  font-weight: 600;
  color: var(--bs-primary);
}
.external {
  margin-left: 0.3rem;
  font-size: 0.65em;
  opacity: 0.6;
}
@media (max-width: 991.98px) {
  .navbar-brand {
    flex: 1 1 0;
  }
  .navbar-collapse {
    margin-top: 0.75rem;
    border-top: 1px solid var(--bs-border-color);
  }
  .nav-item + .nav-item {
    border-top: 1px solid var(--bs-border-color);
  }
  .nav-link {
    padding: 0.75rem 0;
  }
}
@media (min-width: 992px) {
  .navbar-nav {
    gap: 0.25rem;
  }
  .nav-link {
    padding: 0.5rem 0.75rem;
  }
  .nav-link.active::after {
    content: '';
    position: absolute;
    right: 0.75rem;
    bottom: 0;
    left: 0.75rem;
    height: 2px;
    border-radius: 2px;
    background-color: currentColor;
  }
}
</style>
