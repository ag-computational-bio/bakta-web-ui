<template>
  <span class="badge fw-medium" :class="`bg-${tone}-subtle text-${tone}-emphasis`">
    <i class="bi me-1" :class="statusIcon(status)"></i>{{ formatStatus(status) }}
  </span>
</template>

<script setup lang="ts">
import { formatStatus, statusIcon, statusTone, type AnyStatus } from '@/model/status-style'
import { computed } from 'vue'

const props = defineProps<{
  status: AnyStatus
}>()

const tone = computed(() => statusTone(props.status))
</script>
