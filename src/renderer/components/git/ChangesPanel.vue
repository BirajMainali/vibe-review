<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitStore } from '@/stores/git.store'
import { useProjectStore } from '@/stores/project.store'

const emit = defineEmits<{
  (e: 'committed'): void
}>()

const gitStore = useGitStore()
const projectStore = useProjectStore()
const message = ref('')
const committing = ref(false)
const error = ref('')

const repoPath = computed(() => projectStore.currentProject?.path || '')

const stagedFiles = computed(() => gitStore.status?.staged || [])
const modifiedFiles = computed(() => gitStore.status?.modified || [])
const untrackedFiles = computed(() => gitStore.status?.not_added || [])
const deletedFiles = computed(() => gitStore.status?.deleted || [])
const createdFiles = computed(() => gitStore.status?.created || [])

const allChangedFiles = computed(() => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const f of [...stagedFiles.value, ...modifiedFiles.value, ...untrackedFiles.value, ...deletedFiles.value, ...createdFiles.value]) {
    if (!seen.has(f)) {
      seen.add(f)
      result.push(f)
    }
  }
  return result
})

const allStaged = computed(() => {
  if (allChangedFiles.value.length === 0) return false
  return allChangedFiles.value.every((f) => stagedFiles.value.includes(f))
})

const someStaged = computed(() => stagedFiles.value.length > 0)

const canCommit = computed(() => {
  return message.value.trim().length > 0 && stagedFiles.value.length > 0
})

function isStaged(file: string) {
  return stagedFiles.value.includes(file)
}

function getStatusIcon(file: string) {
  if (untrackedFiles.value.includes(file)) return 'U'
  if (createdFiles.value.includes(file)) return 'A'
  if (deletedFiles.value.includes(file)) return 'D'
  return 'M'
}

function getStatusColor(file: string) {
  if (untrackedFiles.value.includes(file)) return 'text-gray-500'
  if (createdFiles.value.includes(file)) return 'text-green-500'
  if (deletedFiles.value.includes(file)) return 'text-red-500'
  return 'text-yellow-500'
}

async function toggleFile(file: string) {
  if (isStaged(file)) {
    await gitStore.unstageFiles(repoPath.value, [file])
  } else {
    await gitStore.stageFiles(repoPath.value, [file])
  }
}

async function toggleAll() {
  if (allStaged.value) {
    await gitStore.unstageFiles(repoPath.value, [...stagedFiles.value])
  } else {
    await gitStore.stageAll(repoPath.value)
  }
}

async function doCommit() {
  if (!canCommit.value || !projectStore.currentProject) return
  committing.value = true
  error.value = ''
  try {
    await gitStore.commitChanges(projectStore.currentProject.path, message.value.trim())
    message.value = ''
    emit('committed')
  } catch (e: any) {
    error.value = e.message || 'Commit failed'
  } finally {
    committing.value = false
  }
}
</script>

<template>
  <div class="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
    <!-- Changes header -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="allStaged"
          :indeterminate="someStaged && !allStaged"
          :disabled="gitStore.staging || allChangedFiles.length === 0"
          @change="toggleAll"
          class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
          {{ allChangedFiles.length }} changed file{{ allChangedFiles.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- File checklist -->
    <div class="flex-1 overflow-y-auto min-h-0 py-2">
      <div v-if="allChangedFiles.length === 0" class="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
        No changed files
      </div>
      <div
        v-for="file in allChangedFiles"
        :key="file"
        class="flex items-center gap-2 px-3 py-1.5 group hover:bg-gray-100 dark:hover:bg-gray-800/50"
      >
        <input
          type="checkbox"
          :checked="isStaged(file)"
          :disabled="gitStore.staging"
          @click.stop
          @change="toggleFile(file)"
          class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
        />
        <span
          class="text-xs font-mono w-5 text-center flex-shrink-0"
          :class="getStatusColor(file)"
        >
          {{ getStatusIcon(file) }}
        </span>
        <span class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0" :title="file">
          {{ file }}
        </span>
      </div>
    </div>

    <!-- Commit at bottom -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <div v-if="error" class="text-xs text-red-600 dark:text-red-400">
        {{ error }}
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
        <textarea
          v-model="message"
          placeholder="Commit message..."
          rows="3"
          class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          @keydown.meta.enter="doCommit"
          @keydown.ctrl.enter="doCommit"
        />
      </div>
      <button
        @click="doCommit"
        :disabled="!canCommit || committing"
        class="w-full py-2 px-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        {{ committing ? 'Committing…' : 'Commit' }}
      </button>
    </div>
  </div>
</template>
