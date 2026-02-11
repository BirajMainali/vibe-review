<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useProjectStore } from '@/stores/project.store'

const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

onMounted(async () => {
  await settingsStore.loadSettings()
  await projectStore.fetchProjects()
})
</script>

<template>
  <AppLayout />
</template>
