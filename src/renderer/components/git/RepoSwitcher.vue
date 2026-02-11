<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project.store'

const projectStore = useProjectStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
})

const currentProject = computed(() => projectStore.currentProject)
const projects = computed(() => projectStore.sortedProjects)
const error = ref('')

async function selectProject(project: { id: number; name: string; path: string }) {
  await projectStore.selectProject(project)
  router.push({ name: 'review', params: { projectId: String(project.id) } })
  open.value = false
}

async function handleAddProject() {
  error.value = ''
  try {
    const project = await projectStore.addProject()
    if (project) {
      await selectProject(project)
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to add repository'
    setTimeout(() => (error.value = ''), 3000)
  }
}

</script>

<template>
  <div class="repo-switcher relative">
    <button
      @click="open = !open"
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      <span class="text-xs text-gray-500 dark:text-gray-400">Current repository</span>
      <span class="max-w-32 truncate">{{ currentProject?.name || 'No project' }}</span>
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Overlay to close on outside click -->
    <div
      v-if="open"
      class="fixed inset-0 z-40"
      @click="open = false"
    />
    <div
      v-if="open"
      class="absolute left-0 top-full mt-1 z-50 w-72 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div v-if="error" class="px-3 py-2 text-xs text-red-600 dark:text-red-400 border-b border-gray-100 dark:border-gray-700">
        {{ error }}
      </div>
      <div v-if="projects.length === 0" class="px-3 py-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        No repositories
      </div>
      <button
        v-for="project in projects"
        :key="project.id"
        @click="selectProject(project)"
        class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        :class="route.params.projectId == String(project.id)
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300'"
      >
        <svg class="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ project.name }}</div>
          <div class="truncate text-xs opacity-70">{{ project.path }}</div>
        </div>
      </button>
      <div class="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
        <button
          @click="handleAddProject"
          class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-blue-600 dark:text-blue-400 text-sm"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add repository
        </button>
      </div>
    </div>
  </div>
</template>
