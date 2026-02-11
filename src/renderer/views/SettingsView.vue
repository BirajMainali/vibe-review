<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'

const settingsStore = useSettingsStore()
const webhookUrl = ref('')
const openaiBaseUrl = ref('')
const openaiApiKey = ref('')
const openaiModel = ref('')
const testResult = ref<{ ok: boolean; message: string } | null>(null)
const testing = ref(false)
const saving = ref(false)
const savingOpenAI = ref(false)

onMounted(() => {
  webhookUrl.value = settingsStore.webhookUrl
  openaiBaseUrl.value = settingsStore.openaiBaseUrl
  openaiApiKey.value = settingsStore.openaiApiKey
  openaiModel.value = settingsStore.openaiModel
})

async function saveWebhookUrl() {
  saving.value = true
  try {
    await settingsStore.setWebhookUrl(webhookUrl.value.trim())
    testResult.value = { ok: true, message: 'Webhook URL saved' }
    setTimeout(() => (testResult.value = null), 3000)
  } finally {
    saving.value = false
  }
}

async function testWebhook() {
  if (!webhookUrl.value.trim()) {
    testResult.value = { ok: false, message: 'Please enter a webhook URL first' }
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const result = await settingsStore.testWebhook(webhookUrl.value.trim())
    testResult.value = {
      ok: result.ok,
      message: result.ok ? `Success (${result.status})` : `Failed: ${result.body || result.status}`
    }
  } catch (e: any) {
    testResult.value = { ok: false, message: e.message }
  } finally {
    testing.value = false
  }
}

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
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">e.g. gpt-4o-mini, gpt-4o, gpt-4. Azure uses deployment name.</p>
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

    <!-- Webhook -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Webhook</h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Webhook URL
        </label>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
          A POST request with the review data (JSON) will be sent to this URL when you submit a review.
        </p>
        <div class="flex gap-2">
          <input
            v-model="webhookUrl"
            type="url"
            placeholder="https://your-webhook-url.com/endpoint"
            class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="saveWebhookUrl"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <div class="mt-3">
          <button
            @click="testWebhook"
            :disabled="testing"
            class="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {{ testing ? 'Testing...' : 'Send Test Request' }}
          </button>
        </div>
        <transition name="fade">
          <div v-if="testResult" class="mt-3 px-3 py-2 text-xs rounded-lg"
            :class="testResult.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'">
            {{ testResult.message }}
          </div>
        </transition>
      </div>
    </section>

    <!-- Export directory -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Export</h2>
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default Export Directory
        </label>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Choose where exported Markdown reviews will be saved by default.
        </p>
        <div class="flex items-center gap-2">
          <div class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 truncate">
            {{ settingsStore.exportDir || 'Not set (will ask each time)' }}
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
  </div>
</template>
