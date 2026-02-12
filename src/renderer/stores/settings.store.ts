import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const exportDir = ref('')
  const darkMode = ref(false)
  const openaiBaseUrl = ref('')
  const openaiApiKey = ref('')
  const openaiModel = ref('')
  const deeplinkPlatformName = ref('')
  const deeplinkUrl = ref('')
  const loading = ref(false)

  async function loadSettings() {
    loading.value = true
    try {
      const all = await window.api.settings.all()
      exportDir.value = all['export_dir'] || ''
      darkMode.value = all['dark_mode'] === 'true'
      openaiBaseUrl.value = all['openai_base_url'] || ''
      openaiApiKey.value = all['openai_api_key'] || ''
      openaiModel.value = all['openai_model'] || ''
      deeplinkPlatformName.value = all['deeplink_platform_name'] || ''
      deeplinkUrl.value = all['deeplink_url'] || ''
      applyDarkMode()
    } finally {
      loading.value = false
    }
  }

  async function setExportDir(dir: string) {
    exportDir.value = dir
    await window.api.settings.set('export_dir', dir)
  }

  async function setDeeplinkConfig(platformName: string, url: string) {
    deeplinkPlatformName.value = platformName
    deeplinkUrl.value = url
    await window.api.settings.set('deeplink_platform_name', platformName)
    await window.api.settings.set('deeplink_url', url)
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

  return {
    exportDir,
    darkMode,
    openaiBaseUrl,
    openaiApiKey,
    openaiModel,
    deeplinkPlatformName,
    deeplinkUrl,
    loading,
    loadSettings,
    setExportDir,
    setOpenAIConfig,
    setDeeplinkConfig,
    toggleDarkMode,
    applyDarkMode
  }
})
