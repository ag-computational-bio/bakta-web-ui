<template>
  <div class="d-flex flex-column">
    <div v-for="c of colors" :key="c.key" class="d-flex align-items-center">
      <div
        style="display: inline-block"
        :style="`width: 1rem; height: 1rem; background: ${c.color};`"
      ></div>
      <div class="ms-2">
        {{ c.key }}
        <template v-if="c.name"> - {{ c.name }} </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ColorEntry } from '@/cog-helper'
defineProps<{
  colors: ColorEntry[]
}>()
</script>
