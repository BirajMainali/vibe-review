<script setup lang="ts">
import { useProjectStore } from '@/stores/project.store'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

const projectStore = useProjectStore()
const router = useRouter()
const route = useRoute()
const error = ref('')

function goToDashboard() {
  router.push({ name: 'dashboard' })
}

function goToSettings() {
  router.push({ name: 'settings' })
}

async function openProject(project: any) {
  await projectStore.selectProject(project)
  router.push({ name: 'review', params: { projectId: project.id } })
}

async function handleAddProject() {
  error.value = ''
  try {
    const project = await projectStore.addProject()
    if (project) {
      await openProject(project)
    }
  } catch (e: any) {
    error.value = e.message
    setTimeout(() => (error.value = ''), 3000)
  }
}
</script>

<template>
  <aside class="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
    <!-- Logo / App title -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
      <button @click="goToDashboard" class="flex items-center gap-2 w-full text-left group">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <span class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vibe Review</span>
      </button>
    </div>

    <!-- Projects list -->
    <div class="flex-1 overflow-y-auto p-3">
      <div class="flex items-center justify-between mb-2 px-1">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Projects</span>
        <button
          @click="handleAddProject"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600 transition-colors"
          title="Add Repository"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <transition name="fade">
        <div v-if="error" class="mb-2 px-2 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
          {{ error }}
        </div>
      </transition>

      <div v-if="projectStore.sortedProjects.length === 0" class="text-center py-8 px-2">
        <svg class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="text-xs text-gray-400 dark:text-gray-500">No projects yet</p>
        <button @click="handleAddProject" class="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Add a repository
        </button>
      </div>

      <nav class="space-y-0.5">
        <button
          v-for="project in projectStore.sortedProjects"
          :key="project.id"
          @click="openProject(project)"
          class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          :class="[
            route.params.projectId == String(project.id)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
          ]"
        >
          <svg class="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{{ project.name }}</div>
            <div class="truncate text-xs text-gray-400 dark:text-gray-500">{{ project.path }}</div>
          </div>
        </button>
      </nav>
    </div>

    <!-- Bottom: Settings -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800">
      <button
        @click="goToSettings"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
        :class="[
          route.name === 'settings'
            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
        ]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </button>
    </div>
  </aside>
</template>
