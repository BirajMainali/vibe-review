import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Review {
  id: number
  project_id: number
  branch: string
  base_commit: string | null
  status: string
  created_at: string
  submitted_at: string | null
}

export interface ReviewComment {
  id: number
  review_id: number
  file_path: string
  start_line: number
  end_line: number
  side: string
  comment: string
  severity: string
  created_at: string
}

export const useReviewStore = defineStore('review', () => {
  const currentReview = ref<Review | null>(null)
  const comments = ref<ReviewComment[]>([])
  const reviews = ref<Review[]>([])
  const loading = ref(false)

  const commentsByFile = computed(() => {
    const grouped: Record<string, ReviewComment[]> = {}
    for (const c of comments.value) {
      if (!grouped[c.file_path]) grouped[c.file_path] = []
      grouped[c.file_path].push(c)
    }
    return grouped
  })

  const severityCounts = computed(() => {
    const counts = { bug: 0, suggestion: 0, nitpick: 0, question: 0 }
    for (const c of comments.value) {
      if (c.severity in counts) {
        counts[c.severity as keyof typeof counts]++
      }
    }
    return counts
  })

  async function fetchReviews(projectId: number) {
    reviews.value = await window.api.reviews.byProject(projectId)
  }

  async function startReview(projectId: number, branch: string, baseCommit: string | null) {
    currentReview.value = await window.api.reviews.create(projectId, branch, baseCommit)
    comments.value = []
  }

  async function loadReview(reviewId: number) {
    currentReview.value = await window.api.reviews.get(reviewId)
    comments.value = await window.api.comments.byReview(reviewId)
  }

  async function addComment(
    filePath: string,
    startLine: number,
    endLine: number,
    side: string,
    comment: string,
    severity: string
  ) {
    if (!currentReview.value) return
    const newComment = await window.api.comments.add(
      currentReview.value.id,
      filePath,
      startLine,
      endLine,
      side,
      comment,
      severity
    )
    comments.value.push(newComment)
  }

  async function updateComment(id: number, comment: string, severity: string) {
    const updated = await window.api.comments.update(id, comment, severity)
    const idx = comments.value.findIndex((c) => c.id === id)
    if (idx !== -1) comments.value[idx] = updated
  }

  async function deleteComment(id: number) {
    await window.api.comments.delete(id)
    comments.value = comments.value.filter((c) => c.id !== id)
  }

  async function submitReview() {
    if (!currentReview.value) return null
    const review = await window.api.reviews.submit(currentReview.value.id)
    currentReview.value = review
    return review
  }

  async function exportMarkdown() {
    if (!currentReview.value) return null
    return window.api.export.markdown(currentReview.value.id)
  }

  async function deleteReview(id: number) {
    await window.api.reviews.delete(id)
    reviews.value = reviews.value.filter((r) => r.id !== id)
    if (currentReview.value?.id === id) {
      currentReview.value = null
      comments.value = []
    }
  }

  function clearCurrent() {
    currentReview.value = null
    comments.value = []
  }

  return {
    currentReview,
    comments,
    reviews,
    loading,
    commentsByFile,
    severityCounts,
    fetchReviews,
    startReview,
    loadReview,
    addComment,
    updateComment,
    deleteComment,
    submitReview,
    exportMarkdown,
    deleteReview,
    clearCurrent
  }
})
