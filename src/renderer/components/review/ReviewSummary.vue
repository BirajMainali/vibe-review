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
  <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 -mt-px shadow-sm">
    <!-- Compact header: title + count + severity pills -->
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="text-xs font-semibold text-gray-900 dark:text-white">Review Summary</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ total }} {{ total === 1 ? 'comment' : 'comments' }}</span>
      <template v-if="total > 0">
        <span v-if="counts.bug > 0" class="inline-flex items-center gap-1">
          <SeverityBadge severity="bug" />
          <span class="text-xs text-gray-600 dark:text-gray-300">{{ counts.bug }}</span>
        </span>
        <span v-if="counts.suggestion > 0" class="inline-flex items-center gap-1">
          <SeverityBadge severity="suggestion" />
          <span class="text-xs text-gray-600 dark:text-gray-300">{{ counts.suggestion }}</span>
        </span>
        <span v-if="counts.nitpick > 0" class="inline-flex items-center gap-1">
          <SeverityBadge severity="nitpick" />
          <span class="text-xs text-gray-600 dark:text-gray-300">{{ counts.nitpick }}</span>
        </span>
        <span v-if="counts.question > 0" class="inline-flex items-center gap-1">
          <SeverityBadge severity="question" />
          <span class="text-xs text-gray-600 dark:text-gray-300">{{ counts.question }}</span>
        </span>
      </template>
    </div>

    <!-- Submitted state or action buttons -->
    <div v-if="isSubmitted" class="px-2 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-md text-center">
      Review submitted
    </div>
    <div v-else-if="!readonly" class="flex gap-2">
      <button
        @click="emit('export')"
        :disabled="total === 0"
        class="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Export
      </button>
      <button
        @click="emit('submit')"
        :disabled="total === 0"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  </div>
</template>
