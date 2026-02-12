<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project.store'
import { useGitStore } from '@/stores/git.store'
import { useReviewStore } from '@/stores/review.store'
import { useSettingsStore } from '@/stores/settings.store'
import TopBar from '@/components/layout/TopBar.vue'
import DiffViewer from '@/components/diff/DiffViewer.vue'
import ReviewPanel from '@/components/review/ReviewPanel.vue'
import ReviewSummary from '@/components/review/ReviewSummary.vue'
import CommentList from '@/components/review/CommentList.vue'
import ChangesPanel from '@/components/git/ChangesPanel.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const gitStore = useGitStore()
const reviewStore = useReviewStore()
const settingsStore = useSettingsStore()

const showChangesPanel = ref(true)
const showCommentForm = ref(false)
const commentFormData = ref<{ filePath: string; startLine: number; endLine: number; side: string } | null>(null)
const error = ref('')
const successMessage = ref('')
const showRightPanel = ref(true)

const projectId = computed(() => Number(route.params.projectId))

// Full diff covers all change types: modified, deleted, created (staged + unstaged + untracked)
const effectiveDiff = computed(() => {
  return gitStore.fullDiffOutput || ''
})

async function init() {
  error.value = ''
  try {
    // Load project
    const project = projectStore.projects.find((p) => p.id === projectId.value)
    if (!project) {
      await projectStore.fetchProjects()
      const p = projectStore.projects.find((p) => p.id === projectId.value)
      if (!p) {
        router.push({ name: 'dashboard' })
        return
      }
      await projectStore.selectProject(p)
    } else {
      await projectStore.selectProject(project)
    }

    // Load git info
    await gitStore.refreshAll(projectStore.currentProject!.path)

    // Start or load a draft review
    const existingReviews = await window.api.reviews.byProject(projectId.value)
    const draftReview = existingReviews.find((r: any) => r.status === 'draft')
    if (draftReview) {
      await reviewStore.loadReview(draftReview.id)
    } else {
      await reviewStore.startReview(
        projectId.value,
        gitStore.currentBranch,
        null
      )
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load project'
  }
}

onMounted(init)

watch(() => route.params.projectId, () => {
  if (route.params.projectId) {
    init()
  }
})

function handleAddComment(data: { filePath: string; startLine: number; endLine: number; side: string }) {
  commentFormData.value = data
  showCommentForm.value = true
}

function handleCommentSaved() {
  showCommentForm.value = false
  commentFormData.value = null
}

async function handleRefresh() {
  if (projectStore.currentProject) {
    await gitStore.refreshAll(projectStore.currentProject.path)
  }
}

async function handlePull() {
  if (!projectStore.currentProject) return
  error.value = ''
  try {
    await gitStore.pullBranch(projectStore.currentProject.path)
  } catch (e: any) {
    error.value = e.message || 'Pull failed'
  }
}

async function handlePush() {
  if (!projectStore.currentProject) return
  error.value = ''
  try {
    await gitStore.pushBranch(projectStore.currentProject.path)
  } catch (e: any) {
    error.value = e.message || 'Push failed'
  }
}

async function handleFinish() {
  if (!reviewStore.currentReview) return
  const exportDir = settingsStore.exportDir?.trim()
  if (!exportDir) {
    error.value = 'Please set Export Directory in Settings first'
    return
  }
  error.value = ''
  successMessage.value = ''
  try {
    const filePath = await window.api.export.markdownToPath(reviewStore.currentReview.id, exportDir)
    if (!filePath?.path) throw new Error('Export failed')

    const url = settingsStore.deeplinkUrl?.trim()
    const hasDeeplink = !!url?.includes('{REVIEW_PATH}') && !!settingsStore.deeplinkPlatformName?.trim()

    if (hasDeeplink) {
      let finalUrl = url
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl
      }
      finalUrl = finalUrl.replace(/\{REVIEW_PATH\}/g, encodeURIComponent(filePath.path))
      await window.api.shell.openExternal(finalUrl)
    } else {
      successMessage.value = `Review exported to ${filePath.path}`
    }
  } catch (e: any) {
    error.value = e.message || 'Export failed'
  }
}

function handleCommitted() {
  handleRefresh()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <TopBar
      @open-pull="handlePull"
      @open-push="handlePush"
      @refresh="handleRefresh"
    />

    <div v-if="error" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border-b border-red-100 dark:border-red-900">
      {{ error }}
      <button @click="error = ''" class="ml-2 underline text-xs">dismiss</button>
    </div>
    <div v-if="successMessage" class="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm border-b border-green-100 dark:border-green-900">
      {{ successMessage }}
      <button @click="successMessage = ''" class="ml-2 underline text-xs">dismiss</button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Changes panel (staging checklist + commit) -->
      <template v-if="showChangesPanel">
        <ChangesPanel
          @committed="handleCommitted"
        />
      </template>

      <!-- Panel toggle (changes) -->
      <button
        @click="showChangesPanel = !showChangesPanel"
        class="flex-shrink-0 w-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition-colors"
        :title="showChangesPanel ? 'Hide changes' : 'Show changes'"
      >
        <svg class="w-3.5 h-3.5 text-gray-400 transition-transform" :class="{ 'rotate-180': showChangesPanel }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Diff area -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Comment form overlay -->
        <transition name="slide">
          <div v-if="showCommentForm && commentFormData" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <ReviewPanel
              :file-path="commentFormData.filePath"
              :start-line="commentFormData.startLine"
              :end-line="commentFormData.endLine"
              :side="commentFormData.side"
              @close="showCommentForm = false"
              @saved="handleCommentSaved"
            />
          </div>
        </transition>

        <!-- Diff viewer -->
        <div class="flex-1 overflow-hidden">
          <DiffViewer
            :diff-string="effectiveDiff"
            :review-comments="reviewStore.comments"
            @add-comment="handleAddComment"
          />
        </div>
      </div>

      <!-- Right panel: review summary + comments -->
      <div v-if="showRightPanel" class="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
        <ReviewSummary
          :deeplink-platform-name="settingsStore.deeplinkPlatformName"
          :deeplink-url="settingsStore.deeplinkUrl"
          :export-dir="settingsStore.exportDir"
          @finish="handleFinish"
        />

        <div>
          <h3 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Comments</h3>
          <CommentList />
        </div>
      </div>

      <!-- Panel toggle -->
      <button
        @click="showRightPanel = !showRightPanel"
        class="flex-shrink-0 w-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-700 transition-colors"
        :title="showRightPanel ? 'Hide panel' : 'Show panel'"
      >
        <svg class="w-3.5 h-3.5 text-gray-400 transition-transform" :class="{ 'rotate-180': !showRightPanel }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

  </div>
</template>
