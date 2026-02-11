<script setup lang="ts">
import { computed } from 'vue'
import { parse, type DiffFile as DiffFileType } from 'diff2html'
import DiffFile from './DiffFile.vue'

const props = defineProps<{
  diffString: string
  reviewComments?: any[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-comment', data: { filePath: string; startLine: number; endLine: number; side: string }): void
}>()

const parsedFiles = computed((): DiffFileType[] => {
  if (!props.diffString) return []
  try {
    return parse(props.diffString)
  } catch {
    return []
  }
})

function getFileComments(filePath: string) {
  if (!props.reviewComments) return []
  return props.reviewComments.filter((c) => c.file_path === filePath)
}

function handleAddComment(data: { filePath: string; startLine: number; endLine: number; side: string }) {
  emit('add-comment', data)
}
</script>

<template>
  <div class="flex h-full" v-if="parsedFiles.length > 0">
    <div class="flex-1 overflow-y-auto code-font text-xs">
      <DiffFile
        v-for="file in parsedFiles"
        :key="file.newName"
        :file="file"
        :comments="getFileComments(file.newName)"
        :readonly="readonly"
        :id="'diff-file-' + file.newName.replace(/[^a-zA-Z0-9]/g, '-')"
        @add-comment="handleAddComment"
      />
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="flex items-center justify-center h-full">
    <div class="text-center py-20">
      <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400">No changes detected</h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Working directory is clean</p>
    </div>
  </div>
</template>
