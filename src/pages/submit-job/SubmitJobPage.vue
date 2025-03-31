<template>
  <div class="container flex-grow-1 page-body">
    <notification :message="error" />
    <form ref="submitform">
      <SubmitForm v-model="request" @update:valid="(evt) => (valid = evt)" />
      <div class="d-flex justify-content-end mb-5">
        <button
          v-if="request.replicons.length > 0 && !submitting"
          class="btn btn-secondary"
          type="button"
          id="submit-button"
          :disabled="!valid"
          @click="submitJob()"
        >
          Submit
        </button>
        <button v-if="submitting" class="btn btn-secondary" type="button" disabled>
          Submitting...
        </button>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import Notification from '@/components/Notification.vue'
import { createBaktaJobRequest } from '@/model/bakta-service'
import { useBaktaService } from '@/page/page'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SubmitForm from './components/SubmitForm.vue'

const bakta = useBaktaService()
const router = useRouter()
const request = ref(createBaktaJobRequest())
const valid = ref(false)
const error = ref<string>()
const submitting = ref(false)

function submitJob() {
  error.value = undefined
  console.log(request.value)
  submitting.value = true
  bakta
    .submitJob(request.value)
    .then((job) => {
      router.push({ name: 'Job', params: { id: job.key } })
    })
    .catch((err) => {
      submitting.value = false
      error.value = err
    })
}
</script>
