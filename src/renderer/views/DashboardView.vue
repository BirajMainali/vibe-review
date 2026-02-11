<script setup lang="ts">
import { useProjectStore } from '@/stores/project.store'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const projectStore = useProjectStore()
const router = useRouter()
const error = ref('')
const confirmRemove = ref<number | null>(null)

async function openProject(project: any) {
  await projectStore.selectProject(project)
  router.push({ name: 'review', params: { projectId: project.id } })
}

async function handleAdd() {
  error.value = ''
  try {
    const project = await projectStore.addProject()
    if (project) {
      await openProject(project)
    }
  } catch (e: any) {
    error.value = e.message
    setTimeout(() => (error.value = ''), 4000)
  }
}

async function handleRemove(id: number) {
  if (confirmRemove.value === id) {
    await projectStore.removeProject(id)
    confirmRemove.value = null
  } else {
    confirmRemove.value = id
    setTimeout(() => (confirmRemove.value = null), 3000)
  }
}

function viewHistory(projectId: number) {
  router.push({ name: 'review-history', params: { projectId } })
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a repository to start a vibe review</p>
      </div>
      <button
        @click="handleAdd"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Repository
      </button>
    </div>

    <!-- Error -->
    <transition name="fade">
      <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
        {{ error }}
      </div>
    </transition>

    <!-- Empty state -->
    <div v-if="projectStore.sortedProjects.length === 0 && !projectStore.loading" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No projects added</h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Add a git repository to start reviewing code</p>
      <button
        @click="handleAdd"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Your First Repository
      </button>
    </div>

    <!-- Project grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="project in projectStore.sortedProjects"
        :key="project.id"
        class="group bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
        @click="openProject(project)"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
            <button
              @click="viewHistory(project.id)"
              class="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              title="View history"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              @click="handleRemove(project.id)"
              class="p-1.5 rounded-md transition-colors"
              :class="confirmRemove === project.id ? 'text-red-600 bg-red-50 dark:bg-red-900/30' : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'"
              :title="confirmRemove === project.id ? 'Click again to confirm' : 'Remove project'"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate">{{ project.name }}</h3>
        <p class="text-xs text-gray-400 dark:text-gray-500 truncate mb-3">{{ project.path }}</p>
        <div class="text-xs text-gray-400 dark:text-gray-500">
          Last opened: {{ formatDate(project.last_opened_at) }}
        </div>
      </div>
    </div>
  </div>
</template>
