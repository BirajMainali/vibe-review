<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitStore } from '@/stores/git.store'
import { useProjectStore } from '@/stores/project.store'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'committed'): void
}>()

const gitStore = useGitStore()
const projectStore = useProjectStore()
const message = ref('')
const committing = ref(false)
const error = ref('')

const canCommit = computed(() => {
  return message.value.trim().length > 0 && (gitStore.status?.staged?.length || 0) > 0
})

async function doCommit() {
  if (!canCommit.value || !projectStore.currentProject) return
  committing.value = true
  error.value = ''
  try {
    await gitStore.commitChanges(projectStore.currentProject.path, message.value.trim())
    message.value = ''
    emit('committed')
    emit('close')
  } catch (e: any) {
    error.value = e.message || 'Commit failed'
  } finally {
    committing.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[480px]">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">Commit Changes</h3>
        <button @click="emit('close')" class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-5">
        <div v-if="error" class="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {{ error }}
        </div>

        <div class="mb-3">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {{ gitStore.status?.staged?.length || 0 }} file(s) staged for commit
          </div>
          <div v-if="(gitStore.status?.staged?.length || 0) === 0" class="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
            No files staged. Stage files first before committing.
          </div>
        </div>

        <div class="relative">
          <textarea
            v-model="message"
            placeholder="Commit message..."
            rows="4"
            class="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            @keydown.meta.enter="doCommit"
            @keydown.ctrl.enter="doCommit"
          />
          <button
            type="button"
            class="absolute left-3 top-3 p-1 rounded-md text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="Generate commit message with AI (coming soon)"
          >
            <!-- AI Bloom / sparkle icon for future commit generation -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </button>
        </div>
        <div class="text-xs text-gray-400 mt-1">Press Ctrl+Enter to commit</div>
      </div>

      <div class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button @click="emit('close')" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Cancel
        </button>
        <button
          @click="doCommit"
          :disabled="!canCommit || committing"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ committing ? 'Committing...' : 'Commit' }}
        </button>
      </div>
    </div>
  </div>
</template>
