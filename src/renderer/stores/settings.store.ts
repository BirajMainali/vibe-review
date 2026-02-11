import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const webhookUrl = ref('')
  const exportDir = ref('')
  const darkMode = ref(false)
  const openaiBaseUrl = ref('')
  const openaiApiKey = ref('')
  const openaiModel = ref('')
  const loading = ref(false)

  async function loadSettings() {
    loading.value = true
    try {
      const all = await window.api.settings.all()
      webhookUrl.value = all['webhook_url'] || ''
      exportDir.value = all['export_dir'] || ''
      darkMode.value = all['dark_mode'] === 'true'
      openaiBaseUrl.value = all['openai_base_url'] || ''
      openaiApiKey.value = all['openai_api_key'] || ''
      openaiModel.value = all['openai_model'] || ''
      applyDarkMode()
    } finally {
      loading.value = false
    }
  }

  async function setWebhookUrl(url: string) {
    webhookUrl.value = url
    await window.api.settings.set('webhook_url', url)
  }

  async function setExportDir(dir: string) {
    exportDir.value = dir
    await window.api.settings.set('export_dir', dir)
  }

  async function setOpenAIConfig(baseUrl: string, apiKey: string, model: string) {
    openaiBaseUrl.value = baseUrl
    openaiApiKey.value = apiKey
    openaiModel.value = model
    await window.api.settings.set('openai_base_url', baseUrl)
    await window.api.settings.set('openai_api_key', apiKey)
    await window.api.settings.set('openai_model', model)
  }

  async function toggleDarkMode() {
    darkMode.value = !darkMode.value
    await window.api.settings.set('dark_mode', String(darkMode.value))
    applyDarkMode()
  }

  function applyDarkMode() {
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function testWebhook(url: string) {
    return window.api.webhook.test(url)
  }

  return {
    webhookUrl,
    exportDir,
    darkMode,
    openaiBaseUrl,
    openaiApiKey,
    openaiModel,
    loading,
    loadSettings,
    setWebhookUrl,
    setExportDir,
    setOpenAIConfig,
    toggleDarkMode,
    testWebhook,
    applyDarkMode
  }
})
