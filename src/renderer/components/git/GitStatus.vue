<script setup lang="ts">
import { computed } from 'vue'
import { useGitStore } from '@/stores/git.store'

const gitStore = useGitStore()

const statusSummary = computed(() => {
  if (!gitStore.status) return null
  const s = gitStore.status
  return {
    staged: s.staged?.length || 0,
    modified: s.modified?.length || 0,
    deleted: s.deleted?.length || 0,
    untracked: s.not_added?.length || 0
  }
})
</script>

<template>
  <div v-if="statusSummary" class="flex items-center gap-2 text-xs">
    <span v-if="statusSummary.staged > 0" class="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400" title="Staged">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
      {{ statusSummary.staged }}
    </span>
    <span v-if="statusSummary.modified > 0" class="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400" title="Changed">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
      {{ statusSummary.modified }}
    </span>
    <span v-if="statusSummary.deleted > 0" class="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400" title="Removed">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
      {{ statusSummary.deleted }}
    </span>
    <span v-if="statusSummary.untracked > 0" class="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="New">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
      {{ statusSummary.untracked }}
    </span>
  </div>
</template>
