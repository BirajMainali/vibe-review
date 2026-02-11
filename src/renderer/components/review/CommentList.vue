<script setup lang="ts">
import { useReviewStore } from '@/stores/review.store'
import CommentCard from './CommentCard.vue'

const props = defineProps<{
  readonly?: boolean
}>()

const reviewStore = useReviewStore()
</script>

<template>
  <div class="space-y-3">
    <div v-if="reviewStore.comments.length === 0" class="text-center py-8">
      <svg class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <p class="text-sm text-gray-400 dark:text-gray-500">No comments yet</p>
      <p class="text-xs text-gray-400 dark:text-gray-600 mt-1">Click on line numbers in the diff to start reviewing</p>
    </div>

    <div v-for="(fileComments, filePath) in reviewStore.commentsByFile" :key="filePath">
      <h4 class="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2 truncate">{{ filePath }}</h4>
      <div class="space-y-2 mb-4">
        <CommentCard
          v-for="comment in fileComments"
          :key="comment.id"
          :comment="comment"
          :readonly="readonly"
        />
      </div>
    </div>
  </div>
</template>
