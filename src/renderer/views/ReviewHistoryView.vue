<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores/review.store'
import { useProjectStore } from '@/stores/project.store'
import SeverityBadge from '@/components/review/SeverityBadge.vue'

const route = useRoute()
const router = useRouter()
const reviewStore = useReviewStore()
const projectStore = useProjectStore()

const projectId = computed(() => Number(route.params.projectId))
const reviews = ref<any[]>([])
const reviewComments = ref<Record<number, any[]>>({})
const loading = ref(false)
const expandedReview = ref<number | null>(null)
const confirmDelete = ref<number | null>(null)

const project = computed(() => projectStore.projects.find((p) => p.id === projectId.value))

onMounted(async () => {
  loading.value = true
  try {
    reviews.value = await window.api.reviews.byProject(projectId.value)
  } finally {
    loading.value = false
  }
})

async function toggleReview(reviewId: number) {
  if (expandedReview.value === reviewId) {
    expandedReview.value = null
    return
  }
  expandedReview.value = reviewId
  if (!reviewComments.value[reviewId]) {
    reviewComments.value[reviewId] = await window.api.comments.byReview(reviewId)
  }
}

async function deleteReview(id: number) {
  if (confirmDelete.value === id) {
    await window.api.reviews.delete(id)
    reviews.value = reviews.value.filter((r) => r.id !== id)
    confirmDelete.value = null
  } else {
    confirmDelete.value = id
    setTimeout(() => (confirmDelete.value = null), 3000)
  }
}

async function exportReview(reviewId: number) {
  await window.api.export.markdown(reviewId)
}

function openReview(project: any) {
  if (project) {
    router.push({ name: 'review', params: { projectId: project.id } })
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSeverityCounts(comments: any[]) {
  const counts = { bug: 0, suggestion: 0, nitpick: 0, question: 0 }
  for (const c of comments) {
    if (c.severity in counts) counts[c.severity as keyof typeof counts]++
  }
  return counts
}
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <button @click="router.back()" class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Review History</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ project?.name || 'Unknown project' }}</p>
      </div>
      <button
        v-if="project"
        @click="openReview(project)"
        class="ml-auto px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        New Review
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>

    <div v-else-if="reviews.length === 0" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400">No reviews yet</h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Start a new review to see it here</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
      >
        <!-- Review header -->
        <div
          class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
          @click="toggleReview(review.id)"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="review.status === 'submitted' ? 'bg-green-500' : 'bg-yellow-500'"
            />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ review.branch }}
                <span class="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                  :class="review.status === 'submitted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'">
                  {{ review.status }}
                </span>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {{ formatDate(review.created_at) }}
                <template v-if="review.submitted_at"> &middot; Submitted {{ formatDate(review.submitted_at) }}</template>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click.stop="exportReview(review.id)"
              class="p-1.5 text-gray-400 hover:text-blue-500 rounded transition-colors"
              title="Export"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
            <button
              @click.stop="deleteReview(review.id)"
              class="p-1.5 rounded transition-colors"
              :class="confirmDelete === review.id ? 'text-red-500' : 'text-gray-400 hover:text-red-500'"
              :title="confirmDelete === review.id ? 'Click again to confirm' : 'Delete'"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <svg
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': expandedReview === review.id }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>

        <!-- Expanded comments -->
        <transition name="slide">
          <div v-if="expandedReview === review.id && reviewComments[review.id]" class="border-t border-gray-100 dark:border-gray-700 px-5 py-4">
            <div v-if="reviewComments[review.id].length === 0" class="text-sm text-gray-400 text-center py-4">
              No comments in this review
            </div>
            <div v-else class="space-y-3">
              <div class="flex items-center gap-3 mb-3 text-xs">
                <span class="text-gray-500">{{ reviewComments[review.id].length }} comment(s)</span>
                <template v-for="(count, severity) in getSeverityCounts(reviewComments[review.id])" :key="severity">
                  <SeverityBadge v-if="count > 0" :severity="severity" />
                  <span v-if="count > 0" class="text-gray-400">{{ count }}</span>
                </template>
              </div>
              <div v-for="comment in reviewComments[review.id]" :key="comment.id" class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <div class="flex items-center gap-2 mb-1">
                  <SeverityBadge :severity="comment.severity" />
                  <span class="text-xs font-mono text-gray-500">{{ comment.file_path }}:{{ comment.start_line }}{{ comment.start_line !== comment.end_line ? '-' + comment.end_line : '' }}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ comment.comment }}</p>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
