<template>
  <div class="d-inline-flex align-items-center gap-1">
    <button
      v-if="primary"
      type="button"
      class="btn btn-icon btn-sm"
      :title="actionLabels[primary]"
      :aria-label="`${actionLabels[primary]} job ${shortId}`"
      :disabled="busy"
      @click="emit('run', primary)"
    >
      <i class="bi" :class="actionIcons[primary]"></i>
    </button>
    <div v-if="others.length" class="dropdown">
      <button
        type="button"
        class="btn btn-icon btn-sm"
        data-bs-toggle="dropdown"
        data-bs-popper-config='{"strategy":"fixed"}'
        aria-expanded="false"
        :aria-label="`More actions for job ${shortId}`"
        title="More actions"
        :disabled="busy"
      >
        <i class="bi bi-three-dots"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end admin-menu">
        <li v-for="action in others" :key="action">
          <button
            type="button"
            class="dropdown-item"
            :class="{ 'text-danger': actionTexts[action].danger }"
            @click="emit('run', action)"
          >
            <i class="bi" :class="actionIcons[action]" aria-hidden="true"></i>
            {{ actionLabels[action] }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../admin-menu.css'
import {
  actionIcons,
  actionLabels,
  actionTexts,
  workflowActions,
  type WorkflowAction,
} from '../workflow-actions'

/*
 * The actions of a row in the job list: at most one quiet icon for the action
 * that helps most (retry or resume), the others in a menu.
 */
const props = defineProps<{
  id: string
  phase: string | null | undefined
  dataAvailable: boolean
  busy: boolean
}>()
const emit = defineEmits<{ (e: 'run', action: WorkflowAction): void }>()

const shortId = computed(() => props.id.slice(0, 8))
const actions = computed(() => workflowActions(props.phase, false, props.dataAvailable))
const primary = computed(() => actions.value.find((a) => a === 'retry' || a === 'resume'))
const others = computed(() => actions.value.filter((a) => a !== primary.value))
</script>
