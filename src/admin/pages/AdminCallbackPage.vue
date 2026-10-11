<template>
  <div class="container">
    <div v-if="error" class="alert alert-danger">
      The login did not work: {{ error }}
      <RouterLink to="/admin" class="ms-2">Back to the admin area</RouterLink>
    </div>
    <div v-else class="card text-center p-5">
      <div class="spinner-border text-primary mx-auto" role="status"></div>
      <p class="text-secondary mt-3 mb-0">Signing in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { completeSignIn } from '../admin-session'

const router = useRouter()
const error = ref<string>()

onMounted(() => {
  completeSignIn()
    .then((path) => router.replace(path))
    .catch((e) => (error.value = e instanceof Error ? e.message : String(e)))
})
</script>
