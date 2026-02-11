<script setup lang="ts">
import { useGitStore } from '@/stores/git.store'
import { useProjectStore } from '@/stores/project.store'
import BranchSwitcher from '@/components/git/BranchSwitcher.vue'
import GitStatus from '@/components/git/GitStatus.vue'

const gitStore = useGitStore()
const projectStore = useProjectStore()

const emit = defineEmits<{
  (e: 'open-commit'): void
  (e: 'open-stager'): void
  (e: 'open-push'): void
  (e: 'refresh'): void
}>()
</script>

<template>
  <div class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
    <div class="flex items-center gap-3">
      <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-48">
        {{ projectStore.currentProject?.name || 'No project' }}
      </h2>
      <BranchSwitcher v-if="projectStore.currentProject" />
    </div>

    <div class="flex items-center gap-2">
      <GitStatus />

      <button
        @click="emit('open-stager')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Stage
      </button>

      <button
        @click="emit('open-commit')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Commit
      </button>

      <button
        @click="emit('open-push')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Push
      </button>

      <button
        @click="emit('refresh')"
        class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :class="{ 'animate-spin': gitStore.loading }"
        title="Refresh"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</template>
