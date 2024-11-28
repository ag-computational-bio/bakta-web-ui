<template>
  <div v-if="messages !== null" :class="classes" role="alert">
    <template v-for="(m, i) in messages" :key="i"> {{ m }} <br /> </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    message: string | string[] | undefined
    type?: 'danger' | 'warning' | 'info' | 'secondary'
  }>(),
  {},
)

const messages = computed(() => {
  if (Array.isArray(props.message)) {
    return props.message
  } else if (props.message) {
    return [props.message]
  } else {
    return null
  }
})
const classes = computed(() => 'alert alert-' + (props.type ?? 'secondary'))
</script>
