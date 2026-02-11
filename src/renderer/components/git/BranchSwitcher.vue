<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGitStore } from '@/stores/git.store'
import { useProjectStore } from '@/stores/project.store'

const gitStore = useGitStore()
const projectStore = useProjectStore()
const isOpen = ref(false)
const newBranchName = ref('')
const showNewBranch = ref(false)
const error = ref('')

function toggle() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    showNewBranch.value = false
    newBranchName.value = ''
    error.value = ''
  }
}

async function switchBranch(branch: string) {
  if (!projectStore.currentProject || branch === gitStore.currentBranch) return
  error.value = ''
  try {
    await gitStore.checkoutBranch(projectStore.currentProject.path, branch)
    isOpen.value = false
  } catch (e: any) {
    error.value = e.message || 'Failed to switch branch'
  }
}

async function createBranch() {
  if (!projectStore.currentProject || !newBranchName.value.trim()) return
  error.value = ''
  try {
    await gitStore.createBranch(projectStore.currentProject.path, newBranchName.value.trim())
    newBranchName.value = ''
    showNewBranch.value = false
  } catch (e: any) {
    error.value = e.message || 'Failed to create branch'
  }
}

// Close on click outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  // If the target was removed from the DOM (e.g. by v-if re-render), skip closing
  if (!target.isConnected) return
  if (!target.closest('.branch-switcher')) {
    isOpen.value = false
    showNewBranch.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative branch-switcher">
    <button
      @click="toggle"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {{ gitStore.currentBranch || '...' }}
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
        <div class="p-2 border-b border-gray-100 dark:border-gray-700">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-1">Switch branch</p>
        </div>

        <div v-if="error" class="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
          {{ error }}
        </div>

        <div class="max-h-48 overflow-y-auto py-1">
          <button
            v-for="branch in gitStore.branches.all"
            :key="branch"
            @click="switchBranch(branch)"
            class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 transition-colors"
            :class="branch === gitStore.currentBranch ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'"
          >
            <svg v-if="branch === gitStore.currentBranch" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else class="w-3.5 flex-shrink-0"></span>
            <span class="truncate">{{ branch }}</span>
          </button>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-700 p-2">
          <div v-if="!showNewBranch">
            <button
              @click="showNewBranch = true"
              class="w-full text-left px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
              + New branch
            </button>
          </div>
          <div v-else class="flex gap-1">
            <input
              v-model="newBranchName"
              @keyup.enter="createBranch"
              placeholder="Branch name..."
              class="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button @click="createBranch" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Create
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
