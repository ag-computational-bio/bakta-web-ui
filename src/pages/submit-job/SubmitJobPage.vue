<template>
  <div class="container flex-grow-1 page-body">
    <notification :message="error" />

    <div class="alert alert-primary mb-1">
      <h1 class="fs-6 fw-bold mb-2">News</h1>
      <article>
        <i class="bi bi-newspaper me-2"></i><b>2026-03</b> Added protein structural annotation
        support using:
        <a href="https://github.com/gbouras13/baktfold" target="_blank">Baktfold</a>
      </article>
      <article class="mt-1">
        <i class="bi bi-newspaper me-2"></i><b>2025-04</b> Check out our latest publication on Bakta
        Web:
        <a href="https://doi.org/10.1093/nar/gkaf335" target="_blank">10.1093/nar/gkaf335</a>
      </article>
    </div>
    <div class="alert alert-secondary">
      <i class="bi bi-info-circle me-2"></i> This service is open to everyone and can be used free
      of charge. For more details
      <RouterLink to="/about">click here</RouterLink>
    </div>

    <form>
      <ul class="nav nav-tabs workflow-tabs mb-4">
        <li v-for="tab in tabs" :key="tab.workflowKind" class="nav-item">
          <button
            class="nav-link d-flex align-items-center gap-2"
            :class="{ active: activeWorkflow === tab.workflowKind }"
            type="button"
            @click="activeWorkflow = tab.workflowKind"
          >
            <i class="bi" :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </li>
      </ul>

      <SubmitForm
        v-if="activeWorkflow === 'bakta'"
        v-model="baktaRequest"
        :show-baktfold-after="supportsBaktaBaktfold"
        @update:valid="(evt) => (baktaValid = evt)"
      />
      <SubmitBaktfoldForm
        v-if="activeWorkflow === 'baktfold'"
        v-model="baktfoldRequest"
        @update:valid="(evt) => (baktfoldValid = evt)"
      />
      <SubmitBaktaProteinsForm
        v-if="activeWorkflow === 'bakta_proteins'"
        v-model="baktaProteinsRequest"
        @update:valid="(evt) => (baktaProteinsValid = evt)"
      />

      <div class="d-flex justify-content-end mb-5 mt-4">
        <button
          v-if="hasActiveInput && !submitting"
          id="submit-button"
          class="btn btn-secondary"
          type="button"
          :disabled="!activeValid"
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
import {
  createBaktaJobRequest,
  createBaktaProteinsJobRequest,
  createBaktfoldJobRequest,
  workflowRouteName,
  type SubmitJobRequest,
} from '@/model/bakta-service'
import type { WorkflowKind } from '@/model/job'
import type { WorkflowDescriptor } from '@/model/submit'
import { useBaktaService } from '@/page/page'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SubmitBaktfoldForm from './components/SubmitBaktfoldForm.vue'
import SubmitBaktaProteinsForm from './components/SubmitBaktaProteinsForm.vue'
import SubmitForm from './components/SubmitForm.vue'

const bakta = useBaktaService()
const router = useRouter()

const baktaRequest = ref(createBaktaJobRequest())
const baktaProteinsRequest = ref(createBaktaProteinsJobRequest())
const baktfoldRequest = ref(createBaktfoldJobRequest())

const baktaValid = ref(false)
const baktaProteinsValid = ref(false)
const baktfoldValid = ref(false)

const workflowTabOrder: WorkflowKind[] = ['bakta', 'baktfold', 'bakta_proteins']

const activeWorkflow = ref<WorkflowKind>('bakta')
const availableWorkflows = ref<WorkflowKind[]>(workflowTabOrder)
const supportsCombinedWorkflow = ref(true)

const error = ref<string>()
const submitting = ref(false)

const tabs = computed(() => {
  const meta: Record<WorkflowKind, { label: string; icon: string }> = {
    bakta: { label: 'Bakta', icon: 'bi-globe' },
    bakta_baktfold: { label: 'Bakta + Baktfold', icon: 'bi-layers' },
    bakta_proteins: { label: 'Bakta Proteins', icon: 'bi-bezier2' },
    baktfold: { label: 'Baktfold', icon: 'bi-stars' },
  }
  return availableWorkflows.value.map((workflowKind) => ({
    workflowKind,
    ...meta[workflowKind],
  }))
})

const supportsBaktaBaktfold = computed(() => supportsCombinedWorkflow.value)

const activeValid = computed(() => {
  switch (activeWorkflow.value) {
    case 'bakta':
      return baktaValid.value
    case 'bakta_proteins':
      return baktaProteinsValid.value
    case 'baktfold':
      return baktfoldValid.value
    case 'bakta_baktfold':
      return baktaValid.value
  }
})

const hasActiveInput = computed(() => {
  switch (activeWorkflow.value) {
    case 'bakta':
      return baktaRequest.value.replicons.length > 0
    case 'bakta_proteins':
      return baktaProteinsRequest.value.proteinFasta != null
    case 'baktfold':
      return baktfoldRequest.value.baktaJson != null
    case 'bakta_baktfold':
      return baktaRequest.value.replicons.length > 0
  }
})

function currentRequest(): SubmitJobRequest {
  switch (activeWorkflow.value) {
    case 'bakta':
      return baktaRequest.value
    case 'bakta_proteins':
      return baktaProteinsRequest.value
    case 'baktfold':
      return baktfoldRequest.value
    case 'bakta_baktfold':
      return baktaRequest.value
  }
}

function submitJob() {
  error.value = undefined
  submitting.value = true
  bakta
    .submitJob(currentRequest())
    .then((job) => {
      router.push({ name: workflowRouteName(job.workflowKind), params: { id: job.key } })
    })
    .catch((err) => {
      submitting.value = false
      error.value = err
    })
}

onMounted(() => {
  bakta
    .workflows()
    .then((workflows: WorkflowDescriptor[]) => {
      supportsCombinedWorkflow.value = workflows.some(
        (workflow) => workflow.workflowKind === 'bakta_baktfold',
      )
      const available = workflowTabOrder.filter((workflowKind) =>
        workflows.some((workflow) => workflow.workflowKind === workflowKind),
      )
      if (available.length > 0) availableWorkflows.value = available
      if (!availableWorkflows.value.includes(activeWorkflow.value)) {
        activeWorkflow.value = availableWorkflows.value[0]
      }
    })
    .catch((err) => {
      console.warn(err)
    })
})
</script>

<style scoped>
.workflow-tabs .nav-link {
  font-weight: 500;
  padding: 0.65rem 1.25rem;
  color: var(--bs-secondary-color);
  border-bottom-width: 2px;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.workflow-tabs .nav-link:hover:not(.active) {
  color: var(--bs-body-color);
  border-color: transparent transparent var(--bs-border-color);
}

.workflow-tabs .nav-link.active {
  font-weight: 600;
  color: var(--bs-emphasis-color);
}
</style>
