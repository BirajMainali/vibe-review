<script setup lang="ts">
import { ref } from 'vue'
import { useReviewStore } from '@/stores/review.store'

const props = defineProps<{
  filePath: string
  startLine: number
  endLine: number
  side: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const reviewStore = useReviewStore()
const comment = ref('')
const severity = ref('suggestion')
const saving = ref(false)

const severities = [
  { value: 'bug', label: 'Bug', color: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
  { value: 'suggestion', label: 'Suggestion', color: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  { value: 'nitpick', label: 'Nitpick', color: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
  { value: 'question', label: 'Question', color: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' }
]

async function save() {
  if (!comment.value.trim()) return
  saving.value = true
  try {
    await reviewStore.addComment(
      props.filePath,
      props.startLine,
      props.endLine,
      props.side,
      comment.value.trim(),
      severity.value
    )
    comment.value = ''
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg overflow-hidden">
    <div class="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-blue-800 dark:text-blue-300">
          Add Comment
          <span class="text-xs font-normal text-blue-600 dark:text-blue-400 ml-2">
            {{ filePath }} : {{ startLine }}{{ startLine !== endLine ? '-' + endLine : '' }}
          </span>
        </div>
        <button @click="emit('close')" class="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 rounded">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <div class="p-4">
      <!-- Severity selector -->
      <div class="flex gap-2 mb-3">
        <button
          v-for="s in severities"
          :key="s.value"
          @click="severity = s.value"
          class="px-2.5 py-1 text-xs font-medium rounded-full border transition-all"
          :class="severity === s.value ? s.color + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Comment input -->
      <textarea
        v-model="comment"
        placeholder="Write your review comment..."
        rows="4"
        class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        @keydown.meta.enter="save"
        @keydown.ctrl.enter="save"
      />

      <div class="flex items-center justify-between mt-3">
        <span class="text-xs text-gray-400">Ctrl+Enter to save</span>
        <div class="flex gap-2">
          <button @click="emit('close')" class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Cancel
          </button>
          <button
            @click="save"
            :disabled="!comment.trim() || saving"
            class="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Saving...' : 'Add Comment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
