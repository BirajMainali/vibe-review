<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: string
  oldNumber: number | undefined
  newNumber: number | undefined
  content: string
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'line-click', lineNumber: number, side: string, event: MouseEvent): void
}>()

const lineClass = computed(() => {
  if (props.selected) return 'diff-line-selected'
  switch (props.type) {
    case 'insert': return 'diff-line-add'
    case 'delete': return 'diff-line-del'
    case 'hunk': return 'diff-line-hunk'
    default: return ''
  }
})

const prefix = computed(() => {
  switch (props.type) {
    case 'insert': return '+'
    case 'delete': return '-'
    case 'hunk': return '@@'
    default: return ' '
  }
})

function handleClick(event: MouseEvent) {
  const lineNum = props.newNumber || props.oldNumber
  if (!lineNum || props.type === 'hunk') return
  const side = props.type === 'delete' ? 'left' : 'right'
  emit('line-click', lineNum, side, event)
}

// Remove the first character (the +/-/ prefix) from content for display
const displayContent = computed(() => {
  if (props.type === 'hunk') return props.content
  return props.content.slice(1) || ' '
})
</script>

<template>
  <tr
    :class="[lineClass, 'hover:brightness-95 dark:hover:brightness-110 transition-all']"
    @click="handleClick"
  >
    <!-- Old line number -->
    <td class="w-12 text-right pr-2 pl-2 select-none text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800 cursor-pointer align-top"
        :class="{ 'text-blue-500 dark:text-blue-400 font-bold': selected }">
      <span v-if="type !== 'insert' && type !== 'hunk' && oldNumber">{{ oldNumber }}</span>
    </td>
    <!-- New line number -->
    <td class="w-12 text-right pr-2 select-none text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800 cursor-pointer align-top"
        :class="{ 'text-blue-500 dark:text-blue-400 font-bold': selected }">
      <span v-if="type !== 'delete' && type !== 'hunk' && newNumber">{{ newNumber }}</span>
    </td>
    <!-- Content -->
    <td class="pl-2 pr-4 whitespace-pre-wrap break-all">
      <span v-if="type !== 'hunk'" class="inline-block w-4 select-none"
            :class="{
              'text-green-600 dark:text-green-400': type === 'insert',
              'text-red-600 dark:text-red-400': type === 'delete'
            }">{{ prefix }}</span>
      <span>{{ displayContent }}</span>
    </td>
  </tr>
</template>
