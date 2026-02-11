<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  severity: string
}>()

const config = computed(() => {
  switch (props.severity) {
    case 'bug':
      return { label: 'Bug', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
    case 'suggestion':
      return { label: 'Suggestion', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' }
    case 'nitpick':
      return { label: 'Nitpick', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' }
    case 'question':
      return { label: 'Question', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' }
    default:
      return { label: props.severity, class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
  }
})
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full" :class="config.class">
    {{ config.label }}
  </span>
</template>
