<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'

const settingsStore = useSettingsStore()
const openaiBaseUrl = ref('')
const openaiApiKey = ref('')
const openaiModel = ref('')
const deeplinkPlatformName = ref('')
const deeplinkUrl = ref('')
const savingOpenAI = ref(false)
const savingDeeplink = ref(false)

onMounted(() => {
  openaiBaseUrl.value = settingsStore.openaiBaseUrl
  openaiApiKey.value = settingsStore.openaiApiKey
  openaiModel.value = settingsStore.openaiModel
  deeplinkPlatformName.value = settingsStore.deeplinkPlatformName
  deeplinkUrl.value = settingsStore.deeplinkUrl
})

async function selectExportDir() {
  const dir = await window.api.dialog.selectExportDir()
  if (dir) {
    await settingsStore.setExportDir(dir)
  }
}

async function saveOpenAIConfig() {
  savingOpenAI.value = true
  try {
    await settingsStore.setOpenAIConfig(openaiBaseUrl.value.trim(), openaiApiKey.value.trim(), openaiModel.value.trim())
  } finally {
    savingOpenAI.value = false
  }
}

function deeplinkFaviconUrl(): string {
  if (!deeplinkUrl.value?.trim()) return ''
  try {
    let urlForParse = deeplinkUrl.value.replace(/\{REVIEW_PATH\}/g, 'x')
    if (!urlForParse.startsWith('http://') && !urlForParse.startsWith('https://')) {
      urlForParse = 'https://' + urlForParse
    }
    const hostname = new URL(urlForParse).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

async function saveDeeplinkConfig() {
  savingDeeplink.value = true
  try {
    await settingsStore.setDeeplinkConfig(deeplinkPlatformName.value.trim(), deeplinkUrl.value.trim())
  } finally {
    savingDeeplink.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Configure your Vibe Review preferences</p>

    <!-- Theme -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Appearance</h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Toggle between light and dark theme</div>
            </div>
            <button
              @click="settingsStore.toggleDarkMode()"
              class="relative w-11 h-6 rounded-full transition-colors"
              :class="settingsStore.darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': settingsStore.darkMode }"
              />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- OpenAI -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">OpenAI / AI Provider</h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Configure your OpenAI-compatible API for AI-generated commit messages. Works with OpenAI, Azure OpenAI, or any compatible endpoint.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base URL</label>
            <input
              v-model="openaiBaseUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
            <input
              v-model="openaiApiKey"
              type="password"
              placeholder="sk-..."
              autocomplete="off"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
            <input
              v-model="openaiModel"
              type="text"
              placeholder="gpt-4o-mini"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Required. OpenAI: gpt-4o-mini, gpt-4o. Azure: deployment name. OpenRouter: provider/model.</p>
          </div>
          <button
            @click="saveOpenAIConfig"
            :disabled="savingOpenAI"
            class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ savingOpenAI ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Export directory (required) -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Export Directory <span class="text-red-500">*</span></h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Where to save reviews
        </label>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Required. Reviews are exported as Markdown files here when you finish a review.
        </p>
        <div class="flex gap-2">
          <div class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 truncate">
            {{ settingsStore.exportDir || 'Not set — configure below' }}
          </div>
          <button
            @click="selectExportDir"
            class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Browse
          </button>
        </div>
      </div>
    </section>

    <!-- Deeplink -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Deeplink</h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Optional. Configure a link to open your review in Cursor or another tool. Use <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{REVIEW_PATH}</code> as a placeholder for the exported file path.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform name</label>
            <input
              v-model="deeplinkPlatformName"
              type="text"
              placeholder="Cursor"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deeplink URL</label>
            <input
              v-model="deeplinkUrl"
              type="url"
              placeholder="https://cursor.com/link/prompt?text=Review from: {REVIEW_PATH}"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div v-if="deeplinkUrl?.trim()" class="flex items-center gap-2">
            <img
              v-if="deeplinkFaviconUrl()"
              :src="deeplinkFaviconUrl()"
              :alt="deeplinkPlatformName || 'Platform'"
              class="w-8 h-8 rounded"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">Preview</span>
          </div>
          <button
            @click="saveDeeplinkConfig"
            :disabled="savingDeeplink"
            class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ savingDeeplink ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
