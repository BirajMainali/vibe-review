import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Git operations
  git: {
    status: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath),
    diff: (repoPath: string) => ipcRenderer.invoke('git:diff', repoPath),
    diffStaged: (repoPath: string) => ipcRenderer.invoke('git:diff-staged', repoPath),
    diffFile: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:diff-file', repoPath, filePath),
    stage: (repoPath: string, files: string[]) => ipcRenderer.invoke('git:stage', repoPath, files),
    unstage: (repoPath: string, files: string[]) => ipcRenderer.invoke('git:unstage', repoPath, files),
    stageAll: (repoPath: string) => ipcRenderer.invoke('git:stage-all', repoPath),
    commit: (repoPath: string, message: string) => ipcRenderer.invoke('git:commit', repoPath, message),
    branches: (repoPath: string) => ipcRenderer.invoke('git:branches', repoPath),
    checkout: (repoPath: string, branch: string) => ipcRenderer.invoke('git:checkout', repoPath, branch),
    createBranch: (repoPath: string, branch: string) => ipcRenderer.invoke('git:create-branch', repoPath, branch),
    log: (repoPath: string, maxCount?: number) => ipcRenderer.invoke('git:log', repoPath, maxCount),
    currentBranch: (repoPath: string) => ipcRenderer.invoke('git:current-branch', repoPath),
    isRepo: (repoPath: string) => ipcRenderer.invoke('git:is-repo', repoPath),
    fileContent: (repoPath: string, filePath: string, ref?: string) =>
      ipcRenderer.invoke('git:file-content', repoPath, filePath, ref),
    pull: (repoPath: string) => ipcRenderer.invoke('git:pull', repoPath),
    push: (repoPath: string) => ipcRenderer.invoke('git:push', repoPath)
  },

  // Database: Projects
  projects: {
    all: () => ipcRenderer.invoke('db:projects:all'),
    get: (id: number) => ipcRenderer.invoke('db:projects:get', id),
    add: (name: string, path: string) => ipcRenderer.invoke('db:projects:add', name, path),
    remove: (id: number) => ipcRenderer.invoke('db:projects:remove', id),
    touch: (id: number) => ipcRenderer.invoke('db:projects:touch', id)
  },

  // Database: Reviews
  reviews: {
    byProject: (projectId: number) => ipcRenderer.invoke('db:reviews:by-project', projectId),
    get: (id: number) => ipcRenderer.invoke('db:reviews:get', id),
    create: (projectId: number, branch: string, baseCommit: string | null) =>
      ipcRenderer.invoke('db:reviews:create', projectId, branch, baseCommit),
    submit: (id: number) => ipcRenderer.invoke('db:reviews:submit', id),
    delete: (id: number) => ipcRenderer.invoke('db:reviews:delete', id)
  },

  // Database: Comments
  comments: {
    byReview: (reviewId: number) => ipcRenderer.invoke('db:comments:by-review', reviewId),
    add: (
      reviewId: number,
      filePath: string,
      startLine: number,
      endLine: number,
      side: string,
      comment: string,
      severity: string
    ) => ipcRenderer.invoke('db:comments:add', reviewId, filePath, startLine, endLine, side, comment, severity),
    update: (id: number, comment: string, severity: string) =>
      ipcRenderer.invoke('db:comments:update', id, comment, severity),
    delete: (id: number) => ipcRenderer.invoke('db:comments:delete', id)
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('db:settings:set', key, value),
    all: () => ipcRenderer.invoke('db:settings:all')
  },

  // Export
  export: {
    markdown: (reviewId: number) => ipcRenderer.invoke('export:markdown', reviewId),
    markdownToPath: (reviewId: number, exportPath: string) =>
      ipcRenderer.invoke('export:markdown-to-path', reviewId, exportPath),
    markdownContent: (reviewId: number) => ipcRenderer.invoke('export:markdown-content', reviewId)
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
  },

  // Dialogs
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
    selectExportDir: () => ipcRenderer.invoke('dialog:select-export-dir')
  },

  // AI
  ai: {
    generateCommitMessage: (repoPath: string) => ipcRenderer.invoke('ai:generate-commit-message', repoPath),
    rephraseComment: (text: string) => ipcRenderer.invoke('ai:rephrase-comment', text)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
