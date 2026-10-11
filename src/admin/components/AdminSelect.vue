<template>
  <div class="dropdown">
    <button
      :id="id"
      ref="toggle"
      type="button"
      class="btn btn-outline-secondary btn-sm admin-toggle"
      :class="{ 'has-icon': icon }"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      :aria-label="`${label}: ${selected?.label ?? ''}`"
    >
      <i v-if="icon" class="bi" :class="icon" aria-hidden="true"></i>
      <span class="toggle-label">{{ label }}</span>
      <span class="toggle-value">{{ selected?.label }}</span>
      <i class="bi bi-chevron-down toggle-chevron" aria-hidden="true"></i>
    </button>
    <ul
      class="dropdown-menu admin-menu"
      :class="{ 'dropdown-menu-end': end }"
      :aria-labelledby="id"
    >
      <template v-for="(option, i) in options" :key="option.value">
        <li v-if="option.group && option.group !== options[i - 1]?.group">
          <h6 class="dropdown-header">{{ option.group }}</h6>
        </li>
        <li>
          <button
            type="button"
            class="dropdown-item"
            :class="{ active: option.value === modelValue }"
            :aria-current="option.value === modelValue ? 'true' : undefined"
            @click="choose(option.value)"
          >
            <i class="bi bi-check2 item-check" aria-hidden="true"></i>
            <span>
              <span class="d-block">{{ option.label }}</span>
              <span v-if="option.description" class="item-description">
                {{ option.description }}
              </span>
            </span>
          </button>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { computed, useId, useTemplateRef } from 'vue'
import '../admin-menu.css'

/*
 * A small styled select for the admin toolbars: a Bootstrap dropdown with a
 * muted label and the value on the button, and a check on the selected item.
 */

export interface SelectOption<V extends string = string> {
  value: V
  label: string
  // a short muted text below the label
  description?: string
  // options with the same group follow each other and get one header
  group?: string
}

const props = defineProps<{
  label: string
  options: SelectOption<T>[]
  icon?: string
  // opens the menu to the left, for selects at the right end of a toolbar
  end?: boolean
}>()
const modelValue = defineModel<T>({ required: true })

const id = useId()
const toggle = useTemplateRef<HTMLButtonElement>('toggle')
const selected = computed(() => props.options.find((o) => o.value === modelValue.value))

function choose(value: T) {
  modelValue.value = value
  // the menu closes, so the focus goes back to the button
  toggle.value?.focus()
}
</script>
