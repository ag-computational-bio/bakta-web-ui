<template>
  <div class="container">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
      <h2 class="section-title mb-0 d-flex align-items-center gap-2">
        Admin
        <span v-if="session.mock" class="badge bg-warning-subtle text-warning-emphasis fw-medium">
          Mock data
        </span>
      </h2>
      <div v-if="session.user" class="d-flex align-items-center gap-2">
        <span class="small text-secondary">
          <i class="bi bi-person-circle me-1"></i>{{ session.user.name || session.user.username }}
        </span>
        <button v-if="!session.mock" class="btn btn-outline-secondary btn-sm" @click="signOut">
          <i class="bi bi-box-arrow-right me-1"></i>Sign out
        </button>
      </div>
    </div>

    <template v-if="session.status === 'ready'">
      <!-- on small screens the tabs scroll sideways instead of being cut off -->
      <ul class="nav nav-tabs flex-nowrap overflow-x-auto overflow-y-hidden mb-4">
        <li v-for="tab in tabs" :key="tab.label" class="nav-item text-nowrap">
          <RouterLink :to="tab.to" class="nav-link" :class="{ active: tab.active }">
            <span :class="{ 'd-none d-sm-inline': tab.short }">{{ tab.label }}</span>
            <span v-if="tab.short" class="d-sm-none">{{ tab.short }}</span>
          </RouterLink>
        </li>
      </ul>
      <RouterView />
    </template>

    <div v-else-if="session.status === 'loading'" class="card text-center p-5 mt-3">
      <div class="spinner-border text-primary mx-auto" role="status"></div>
      <p class="text-secondary mt-3 mb-0">Loading...</p>
    </div>

    <div v-else-if="session.status === 'signed-out'" class="card text-center p-5 mt-3">
      <i class="bi bi-shield-lock fs-1 text-secondary"></i>
      <p class="fw-semibold mt-2 mb-1">Sign in to open the admin area</p>
      <p class="text-secondary">The admin area needs a Bakta Web account with admin rights.</p>
      <div>
        <button class="btn btn-primary" @click="signIn(route.fullPath)">
          <i class="bi bi-box-arrow-in-right me-1"></i>Sign in
        </button>
      </div>
    </div>

    <div v-else-if="session.status === 'forbidden'" class="card text-center p-5 mt-3">
      <i class="bi bi-slash-circle fs-1 text-danger"></i>
      <p class="fw-semibold mt-2 mb-1">Not authorized</p>
      <p class="text-secondary">
        You are signed in, but your account is not in the admin group. Please ask an administrator
        for access, or sign in with another account.
      </p>
      <div>
        <button class="btn btn-outline-secondary" @click="signOut">
          <i class="bi bi-box-arrow-right me-1"></i>Sign out
        </button>
      </div>
    </div>

    <div v-else-if="session.status === 'not-configured'" class="alert alert-secondary mt-3">
      The admin area is not configured. Add the "admin" settings to config/config.json.
    </div>

    <div v-else class="alert alert-danger mt-3 d-flex align-items-center gap-3">
      <span class="flex-grow-1">The admin API is not available: {{ session.error }}</span>
      <button class="btn btn-outline-secondary btn-sm" @click="startSession(true)">
        Try again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { filterQuery, filters, readFilterQuery } from '../admin-filters'
import { session, signIn, signOut, startSession } from '../admin-session'

const route = useRoute()
const router = useRouter()

// the time range lives in the URL, so a link, back and forward open the same range;
// the job page shows no time range and keeps the one of the list
watch(
  () => [route.name, route.query.range, route.query.from, route.query.to],
  () => route.name !== 'AdminJob' && readFilterQuery(route.query),
  { immediate: true },
)
watch(
  () => [filters.range, filters.customFrom, filters.customTo],
  () => router.replace({ hash: route.hash, query: { ...route.query, ...filterQuery() } }),
)

const tabs = computed(() => [
  {
    label: 'Overview',
    to: { path: '/admin', query: filterQuery() },
    active: route.name === 'AdminOverview',
  },
  {
    label: 'Runtimes',
    to: { path: '/admin/runtimes', query: filterQuery() },
    active: route.name === 'AdminRuntimes',
  },
  {
    label: 'Input sizes',
    // a shorter label on small screens, so all tabs fit
    short: 'Inputs',
    to: { path: '/admin/inputs', query: filterQuery() },
    active: route.name === 'AdminInputs',
  },
  {
    label: 'Jobs',
    to: { path: '/admin/jobs', query: filterQuery() },
    active: route.name === 'AdminJobs' || route.name === 'AdminJob',
  },
])

onMounted(() => startSession())
</script>
