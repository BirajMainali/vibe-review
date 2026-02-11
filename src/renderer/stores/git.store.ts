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
  const diffStagedOutput = ref('')
  const log = ref<LogEntry[]>([])
  const loading = ref(false)
  const pulling = ref(false)
  const pushing = ref(false)
  const staging = ref(false)

  async function fetchStatus(repoPath: string) {
    status.value = await window.api.git.status(repoPath)
    currentBranch.value = status.value?.current || ''
  }

  async function fetchDiff(repoPath: string) {
    diffOutput.value = await window.api.git.diff(repoPath)
  }

  async function fetchDiffStaged(repoPath: string) {
    diffStagedOutput.value = await window.api.git.diffStaged(repoPath)
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
    staging.value = true
    try {
      await window.api.git.stage(repoPath, files)
      await fetchStatus(repoPath)
    } finally {
      staging.value = false
    }
  }

  async function unstageFiles(repoPath: string, files: string[]) {
    staging.value = true
    try {
      await window.api.git.unstage(repoPath, files)
      await fetchStatus(repoPath)
    } finally {
      staging.value = false
    }
  }

  async function stageAll(repoPath: string) {
    staging.value = true
    try {
      await window.api.git.stageAll(repoPath)
      await fetchStatus(repoPath)
    } finally {
      staging.value = false
    }
  }

  async function commitChanges(repoPath: string, message: string) {
    const hash = await window.api.git.commit(repoPath, message)
    await refreshAll(repoPath)
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

  async function pullBranch(repoPath: string) {
    pulling.value = true
    try {
      await window.api.git.pull(repoPath)
      await refreshAll(repoPath)
    } finally {
      pulling.value = false
    }
  }

  async function pushBranch(repoPath: string) {
    pushing.value = true
    try {
      await window.api.git.push(repoPath)
      await refreshAll(repoPath)
    } finally {
      pushing.value = false
    }
  }

  async function refreshAll(repoPath: string) {
    loading.value = true
    try {
      await Promise.all([
        fetchStatus(repoPath),
        fetchDiff(repoPath),
        fetchDiffStaged(repoPath),
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
    diffStagedOutput,
    log,
    loading,
    pulling,
    pushing,
    staging,
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
    pullBranch,
    pushBranch,
    refreshAll
  }
})
