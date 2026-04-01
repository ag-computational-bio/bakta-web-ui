<template>
  <div class="container flex-grow-1 page-body d-flex align-items-center justify-content-center">
    <Notification :message="error" />
    <div v-if="!error" class="text-secondary d-flex align-items-center gap-3">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span>Loading job view...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { JobSchema } from '@/model/job'
import { workflowRouteName } from '@/model/bakta-service'
import { useBaktaService } from '@/page/page'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const bakta = useBaktaService()
const route = useRoute()
const router = useRouter()
const error = ref<string>()

const jobToken = computed(() => {
  const token = route.params.id
  if (typeof token !== 'string') throw "Can't process job token. Invalid format."
  return JobSchema.parse(JSON.parse(atob(token)))
})

function redirect() {
  const routeName = workflowRouteName(jobToken.value.workflowKind)
  router.replace({ name: routeName, params: { id: route.params.id } })
}

onMounted(() => {
  try {
    if (jobToken.value.workflowKind) {
      redirect()
      return
    }
  } catch (err) {
    error.value = `${err}`
    return
  }

  bakta
    .job(jobToken.value)
    .then((job) => {
      router.replace({ name: workflowRouteName(job.workflowKind), params: { id: route.params.id } })
    })
    .catch((err) => {
      error.value = err
    })
})
</script>
