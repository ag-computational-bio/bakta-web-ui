<template>
  <div class="d-flex justify-content-end">
    <nav class="navbar navbar-expand-lg navbar-light bg-white">
      <div class="container-fluid">
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
          <div class="d-flex justify-content-end">
            <ul class="navbar-nav">
              <template v-for="item in nav" :key="item.label">
                <li class="nav-item">
                  <template v-if="item.local">
                    <router-link v-if="item.active" :to="item.href" class="nav-link active">
                      {{ item.label }}
                    </router-link>
                    <router-link v-else :to="item.href" class="nav-link">
                      {{ item.label }}
                    </router-link>
                  </template>
                  <template v-else>
                    <a class="nav-link" target="_blank" :href="item.href">{{ item.label }}</a>
                  </template>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </div>
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
<style>
.nav-link.active {
  font-weight: 600;
}
</style>
