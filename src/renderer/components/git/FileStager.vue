<script setup lang="ts">
import { computed } from 'vue'
import { useGitStore } from '@/stores/git.store'
import { useProjectStore } from '@/stores/project.store'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gitStore = useGitStore()
const projectStore = useProjectStore()

const repoPath = computed(() => projectStore.currentProject?.path || '')

const stagedFiles = computed(() => gitStore.status?.staged || [])
const modifiedFiles = computed(() => gitStore.status?.modified || [])
const untrackedFiles = computed(() => gitStore.status?.not_added || [])
const deletedFiles = computed(() => gitStore.status?.deleted || [])

const allUnstaged = computed(() => [
  ...modifiedFiles.value,
  ...untrackedFiles.value,
  ...deletedFiles.value
])

async function stageFile(file: string) {
  await gitStore.stageFiles(repoPath.value, [file])
}

async function unstageFile(file: string) {
  await gitStore.unstageFiles(repoPath.value, [file])
}

async function stageAll() {
  await gitStore.stageAll(repoPath.value)
}

function getStatusIcon(file: string) {
  if (untrackedFiles.value.includes(file)) return 'U'
  if (deletedFiles.value.includes(file)) return 'D'
  return 'M'
}

function getStatusColor(file: string) {
  if (untrackedFiles.value.includes(file)) return 'text-gray-500'
  if (deletedFiles.value.includes(file)) return 'text-red-500'
  return 'text-yellow-500'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">Stage Files</h3>
        <button @click="emit('close')" class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Staged -->
        <div class="px-5 py-3">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
              Staged ({{ stagedFiles.length }})
            </h4>
          </div>
          <div v-if="stagedFiles.length === 0" class="text-xs text-gray-400 py-2">No staged files</div>
          <div v-for="file in stagedFiles" :key="'s-' + file" class="flex items-center justify-between py-1.5 group">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs font-mono text-green-500 w-4 text-center">S</span>
              <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ file }}</span>
            </div>
            <button
              @click="unstageFile(file)"
              :disabled="gitStore.staging"
              class="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 disabled:cursor-wait"
            >
              {{ gitStore.staging ? '…' : 'Unstage' }}
            </button>
          </div>
        </div>

        <!-- Unstaged -->
        <div class="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
              Changes ({{ allUnstaged.length }})
            </h4>
            <button
              v-if="allUnstaged.length > 0"
              @click="stageAll"
              :disabled="gitStore.staging"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60 disabled:cursor-wait"
            >
              {{ gitStore.staging ? 'Staging…' : 'Stage All' }}
            </button>
          </div>
          <div v-if="allUnstaged.length === 0" class="text-xs text-gray-400 py-2">No unstaged changes</div>
          <div v-for="file in allUnstaged" :key="'u-' + file" class="flex items-center justify-between py-1.5 group">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs font-mono w-4 text-center" :class="getStatusColor(file)">{{ getStatusIcon(file) }}</span>
              <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ file }}</span>
            </div>
            <button
              @click="stageFile(file)"
              :disabled="gitStore.staging"
              class="text-xs text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all px-2 py-0.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-60 disabled:cursor-wait"
            >
              {{ gitStore.staging ? '…' : 'Stage' }}
            </button>
          </div>
        </div>
      </div>

      <div class="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button @click="emit('close')" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Done
        </button>
      </div>
    </div>
  </div>
</template>
