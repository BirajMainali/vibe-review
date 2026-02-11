<script setup lang="ts">
import { computed } from 'vue'
import { useReviewStore } from '@/stores/review.store'
import SeverityBadge from './SeverityBadge.vue'

const reviewStore = useReviewStore()

const props = defineProps<{
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'export'): void
}>()

const total = computed(() => reviewStore.comments.length)
const counts = computed(() => reviewStore.severityCounts)
const isSubmitted = computed(() => reviewStore.currentReview?.status === 'submitted')
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Review Summary</h3>

    <div class="space-y-2 mb-4">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500 dark:text-gray-400">Total Comments</span>
        <span class="font-semibold text-gray-900 dark:text-white">{{ total }}</span>
      </div>

      <div v-if="counts.bug > 0" class="flex items-center justify-between text-sm">
        <SeverityBadge severity="bug" />
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ counts.bug }}</span>
      </div>
      <div v-if="counts.suggestion > 0" class="flex items-center justify-between text-sm">
        <SeverityBadge severity="suggestion" />
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ counts.suggestion }}</span>
      </div>
      <div v-if="counts.nitpick > 0" class="flex items-center justify-between text-sm">
        <SeverityBadge severity="nitpick" />
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ counts.nitpick }}</span>
      </div>
      <div v-if="counts.question > 0" class="flex items-center justify-between text-sm">
        <SeverityBadge severity="question" />
        <span class="font-medium text-gray-700 dark:text-gray-300">{{ counts.question }}</span>
      </div>
    </div>

    <div v-if="isSubmitted" class="mb-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-lg text-center">
      Review submitted
    </div>

    <div v-if="!readonly" class="space-y-2">
      <button
        @click="emit('export')"
        :disabled="total === 0"
        class="w-full px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Export Markdown
      </button>
      <button
        v-if="!isSubmitted"
        @click="emit('submit')"
        :disabled="total === 0"
        class="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Review
      </button>
    </div>
  </div>
</template>
