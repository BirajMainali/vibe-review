import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface GitFileStatus {
  path: string
  index: string
  working_dir: string
}

export interface BranchInfo {
  current: string
  all: string[]
}

export interface LogEntry {
  hash: string
  date: string
  message: string
  author_name: string
}

export const useGitStore = defineStore('git', () => {
  const currentBranch = ref('')
  const branches = ref<BranchInfo>({ current: '', all: [] })
  const status = ref<any>(null)
  const diffOutput = ref('')
  const log = ref<LogEntry[]>([])
  const loading = ref(false)

  async function fetchStatus(repoPath: string) {
    status.value = await window.api.git.status(repoPath)
    currentBranch.value = status.value?.current || ''
  }

  async function fetchDiff(repoPath: string) {
    diffOutput.value = await window.api.git.diff(repoPath)
  }

  async function fetchBranches(repoPath: string) {
    const result = await window.api.git.branches(repoPath)
    branches.value = {
      current: result.current,
      all: result.all
    }
    currentBranch.value = result.current
  }

  async function fetchLog(repoPath: string) {
    const result = await window.api.git.log(repoPath, 30)
    log.value = result.all.map((entry: any) => ({
      hash: entry.hash,
      date: entry.date,
      message: entry.message,
      author_name: entry.author_name
    }))
  }

  async function stageFiles(repoPath: string, files: string[]) {
    await window.api.git.stage(repoPath, files)
    await fetchStatus(repoPath)
  }

  async function unstageFiles(repoPath: string, files: string[]) {
    await window.api.git.unstage(repoPath, files)
    await fetchStatus(repoPath)
  }

  async function stageAll(repoPath: string) {
    await window.api.git.stageAll(repoPath)
    await fetchStatus(repoPath)
  }

  async function commitChanges(repoPath: string, message: string) {
    const hash = await window.api.git.commit(repoPath, message)
    await fetchStatus(repoPath)
    await fetchLog(repoPath)
    return hash
  }

  async function checkoutBranch(repoPath: string, branch: string) {
    await window.api.git.checkout(repoPath, branch)
    await fetchStatus(repoPath)
    await fetchBranches(repoPath)
    await fetchDiff(repoPath)
  }

  async function createBranch(repoPath: string, branch: string) {
    await window.api.git.createBranch(repoPath, branch)
    await fetchBranches(repoPath)
  }

  async function pushBranch(repoPath: string) {
    await window.api.git.push(repoPath)
    await refreshAll(repoPath)
  }

  async function refreshAll(repoPath: string) {
    loading.value = true
    try {
      await Promise.all([
        fetchStatus(repoPath),
        fetchDiff(repoPath),
        fetchBranches(repoPath),
        fetchLog(repoPath)
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    currentBranch,
    branches,
    status,
    diffOutput,
    log,
    loading,
    fetchStatus,
    fetchDiff,
    fetchBranches,
    fetchLog,
    stageFiles,
    unstageFiles,
    stageAll,
    commitChanges,
    checkoutBranch,
    createBranch,
    pushBranch,
    refreshAll
  }
})
