<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar />
    <main class="flex-1 overflow-auto bg-white dark:bg-gray-900">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
