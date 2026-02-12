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
const generating = ref(false)
const error = ref('')

const repoPath = computed(() => projectStore.currentProject?.path || '')

const stagedFiles = computed(() => gitStore.status?.staged || [])
const modifiedFiles = computed(() => gitStore.status?.modified || [])
const untrackedFiles = computed(() => gitStore.status?.not_added || [])
const deletedFiles = computed(() => gitStore.status?.deleted || [])
const createdFiles = computed(() => gitStore.status?.created || [])

type FileCategory = 'modified' | 'removed' | 'added'

const categorizedFiles = computed(() => {
  const result: { modified: string[]; removed: string[]; added: string[] } = {
    modified: [],
    removed: [],
    added: []
  }
  const seen = new Set<string>()

  const add = (file: string, cat: FileCategory) => {
    if (!seen.has(file)) {
      seen.add(file)
      result[cat].push(file)
    }
  }

  // Use status.files when available for proper categorization
  const files = gitStore.status?.files
  if (files?.length) {
    for (const f of files) {
      const path = f.path
      const idx = (f as { index?: string }).index
      const wdir = (f as { working_dir?: string }).working_dir
      if (idx === 'D' || wdir === 'D') add(path, 'removed')
      else if (idx === 'A' || wdir === '?' || createdFiles.value.includes(path) || untrackedFiles.value.includes(path)) add(path, 'added')
      else add(path, 'modified')
    }
    return result
  }

  for (const f of deletedFiles.value) add(f, 'removed')
  for (const f of [...createdFiles.value, ...untrackedFiles.value]) add(f, 'added')
  for (const f of [...stagedFiles.value, ...modifiedFiles.value]) add(f, 'modified')
  return result
})

const allChangedFiles = computed(() => [
  ...categorizedFiles.value.modified,
  ...categorizedFiles.value.removed,
  ...categorizedFiles.value.added
])

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

function getFileCategory(file: string): FileCategory {
  if (deletedFiles.value.includes(file)) return 'removed'
  if (createdFiles.value.includes(file) || untrackedFiles.value.includes(file)) return 'added'
  return 'modified'
}

const categoryLabels: Record<FileCategory, string> = {
  modified: 'Changed',
  removed: 'Removed',
  added: 'New'
}

function getStatusLabel(file: string) {
  return categoryLabels[getFileCategory(file)]
}

function getStatusBadgeClass(file: string) {
  const cat = getFileCategory(file)
  if (cat === 'added') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  if (cat === 'removed') return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
  return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
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
    error.value = ''
    emit('committed')
  } catch (e: any) {
    error.value = e.message || 'Commit failed'
  } finally {
    committing.value = false
  }
}

async function generateCommitMessage() {
  if (!projectStore.currentProject) return
  if (stagedFiles.value.length === 0) {
    error.value = 'Stage files first to generate a commit message'
    return
  }
  if (!window.api?.ai?.generateCommitMessage) {
    error.value = 'AI feature not available. Please restart the app.'
    return
  }
  generating.value = true
  error.value = ''
  try {
    const generated = await window.api.ai.generateCommitMessage(projectStore.currentProject.path)
    message.value = generated
  } catch (e: any) {
    error.value = e.message || 'Failed to generate commit message'
  } finally {
    generating.value = false
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
      <template v-else>
        <section v-for="cat in (['modified', 'removed', 'added'] as const)" :key="cat" v-show="categorizedFiles[cat].length > 0">
          <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {{ categoryLabels[cat] }}
          </div>
          <div
            v-for="file in categorizedFiles[cat]"
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
              class="inline-flex shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded"
              :class="getStatusBadgeClass(file)"
            >
              {{ getStatusLabel(file) }}
            </span>
            <span
              class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0 cursor-default"
              :title="file"
            >
              {{ file }}
            </span>
          </div>
        </section>
      </template>
    </div>

    <!-- Commit at bottom -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
      <div v-if="error" class="text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
        <span class="min-w-0">{{ error }}</span>
        <button @click="error = ''" class="flex-shrink-0 underline hover:no-underline" title="Dismiss">×</button>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
        <div class="relative">
          <textarea
            v-model="message"
            placeholder="Commit message..."
            rows="3"
            class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            @keydown.meta.enter="doCommit"
            @keydown.ctrl.enter="doCommit"
          />
          <button
            type="button"
            @click="generateCommitMessage"
            :disabled="generating || stagedFiles.length === 0"
            class="absolute left-2.5 top-2.5 p-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :class="generating ? 'text-blue-400' : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'"
            title="Generate commit message with AI"
          >
            <svg v-if="generating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </button>
        </div>
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
