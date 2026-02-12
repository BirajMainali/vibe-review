<script setup lang="ts">
import { ref } from 'vue'
import SeverityBadge from './SeverityBadge.vue'
import { useReviewStore } from '@/stores/review.store'

const props = defineProps<{
  comment: {
    id: number
    file_path: string
    start_line: number
    end_line: number
    side: string
    comment: string
    severity: string
    created_at: string
  }
  readonly?: boolean
}>()

const reviewStore = useReviewStore()
const editing = ref(false)
const editText = ref('')
const editSeverity = ref('')
const confirmDelete = ref(false)

function startEdit() {
  editText.value = props.comment.comment
  editSeverity.value = props.comment.severity
  editing.value = true
}

async function saveEdit() {
  if (!editText.value.trim()) return
  await reviewStore.updateComment(props.comment.id, editText.value.trim(), editSeverity.value)
  editing.value = false
}

async function deleteComment() {
  if (confirmDelete.value) {
    await reviewStore.deleteComment(props.comment.id)
    confirmDelete.value = false
  } else {
    confirmDelete.value = true
    setTimeout(() => (confirmDelete.value = false), 3000)
  }
}

function cancelEdit() {
  editing.value = false
  editText.value = ''
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm font-sans text-sm">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <SeverityBadge v-if="!editing" :severity="comment.severity" />
        <select
          v-else
          v-model="editSeverity"
          class="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
        >
          <option value="bug">Bug</option>
          <option value="suggestion">Suggestion</option>
          <option value="nitpick">Nitpick</option>
          <option value="question">Question</option>
        </select>
        <span class="text-xs text-gray-400 dark:text-gray-500">
          Lines {{ comment.start_line }}{{ comment.start_line !== comment.end_line ? '-' + comment.end_line : '' }}
        </span>
      </div>
      <div v-if="!readonly" class="flex items-center gap-1">
        <template v-if="!editing">
          <button @click="startEdit" class="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors" title="Edit">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            @click="deleteComment"
            class="p-1 rounded transition-colors"
            :class="confirmDelete ? 'text-red-500' : 'text-gray-400 hover:text-red-500'"
            :title="confirmDelete ? 'Click again to confirm' : 'Delete'"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </template>
      </div>
    </div>

    <!-- Body -->
    <div class="px-3 py-2">
      <div v-if="!editing" class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ comment.comment }}</div>
      <div v-else>
        <textarea
          v-model="editText"
          rows="3"
          class="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <div class="flex justify-end gap-2 mt-2">
          <button @click="cancelEdit" class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Cancel
          </button>
          <button @click="saveEdit" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
