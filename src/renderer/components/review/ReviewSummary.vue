<script setup lang="ts">
import { computed } from 'vue'
import { useReviewStore } from '@/stores/review.store'
import SeverityBadge from './SeverityBadge.vue'

const reviewStore = useReviewStore()

const props = defineProps<{
  readonly?: boolean
  deeplinkPlatformName?: string
  deeplinkUrl?: string
  exportDir?: string
}>()

const emit = defineEmits<{
  (e: 'finish'): void
}>()

const total = computed(() => reviewStore.comments.length)
const counts = computed(() => reviewStore.severityCounts)
const isSubmitted = computed(() => reviewStore.currentReview?.status === 'submitted')
const hasDeeplink = computed(() => {
  const url = props.deeplinkUrl?.trim()
  return !!props.deeplinkPlatformName?.trim() && !!url?.includes('{REVIEW_PATH}')
})
const canFinish = computed(() => !!props.exportDir?.trim())

function deeplinkFaviconUrl(): string {
  if (!props.deeplinkUrl?.trim()) return ''
  try {
    let urlForParse = props.deeplinkUrl.replace(/\{REVIEW_PATH\}/g, 'x')
    if (!urlForParse.startsWith('http://') && !urlForParse.startsWith('https://')) {
      urlForParse = 'https://' + urlForParse
    }
    const hostname = new URL(urlForParse).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}
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
        @click="emit('finish')"
        :disabled="total === 0 || !canFinish"
        :title="!canFinish ? 'Set Export Directory in Settings first' : ''"
        class="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
      >
        <img v-if="hasDeeplink && deeplinkFaviconUrl()" :src="deeplinkFaviconUrl()" alt="" class="w-3.5 h-3.5 rounded" />
        {{ hasDeeplink ? `Export & Finish in ${deeplinkPlatformName || 'Platform'}` : 'Export & Finish' }}
      </button>
    </div>
  </div>
</template>
