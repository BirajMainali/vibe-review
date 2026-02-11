<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppTopBar from './AppTopBar.vue'

const route = useRoute()
const isReview = () => route.name === 'review'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <AppTopBar v-if="!isReview()" />
    <main class="flex-1 overflow-auto bg-white dark:bg-gray-900">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
