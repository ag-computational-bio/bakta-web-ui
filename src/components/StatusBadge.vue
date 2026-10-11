<template>
  <span
    class="badge fw-medium"
    :class="strong ? `text-bg-${tone}` : `bg-${tone}-subtle text-${tone}-emphasis`"
  >
    <i class="bi me-1" :class="statusIcon(status)"></i>{{ formatStatus(status) }}
  </span>
</template>

<script setup lang="ts">
import { formatStatus, statusIcon, statusTone, type AnyStatus } from '@/model/status-style'
import { computed } from 'vue'

// strong colors for the page that follows a single job, light colors in lists
const props = defineProps<{
  status: AnyStatus
  strong?: boolean
}>()

const tone = computed(() => statusTone(props.status))
</script>
