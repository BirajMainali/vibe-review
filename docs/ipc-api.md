# IPC API Reference

## Overview

Electron IPC (Inter-Process Communication) is the bridge between the renderer process (Vue app) and the main process (Node.js). Vibe Review uses the **invoke/handle** pattern exclusively — all calls are request/response style (no fire-and-forget).

### How It Works

1. **Main process** registers handlers via `ipcMain.handle(channel, handler)`
2. **Preload script** wraps `ipcRenderer.invoke(channel, ...args)` in a typed `api` object
3. **Renderer** calls `window.api.*` methods — fully typed via `Api` type export

All IPC handlers are registered in `src/main/index.ts` at app startup:

```typescript
registerGitIpc()    // src/main/ipc/git.ipc.ts
registerDbIpc()     // src/main/ipc/db.ipc.ts
registerReviewIpc() // src/main/ipc/review.ipc.ts
registerExportIpc() // src/main/ipc/export.ipc.ts
registerAiIpc()     // src/main/ipc/ai.ipc.ts
```

Plus two inline handlers in `index.ts`:
- `dialog:open-directory`
- `dialog:select-export-dir`
- `shell:open-external`

---

## Preload Bridge

**Source**: `src/preload/index.ts`

The preload script exposes `window.api` via `contextBridge.exposeInMainWorld('api', api)`. The `Api` type is exported for TypeScript usage in the renderer.

**Type declarations**:
- `src/preload/index.d.ts` — declares `window.api: Api` globally
- `src/renderer/env.d.ts` — re-declares for Vite/Vue type resolution

---

## Channel Reference

### Git Operations (`git:*`)

**IPC file**: `src/main/ipc/git.ipc.ts`
**Service**: `src/main/services/git.service.ts`
**Renderer access**: `window.api.git.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `git:status` | `git.status(repoPath)` | `string` | Serialized status object | Get working directory status (staged, modified, deleted, untracked files, branch info, ahead/behind counts) |
| `git:diff` | `git.diff(repoPath)` | `string` | `string` | Unstaged diff (unified format) |
| `git:diff-staged` | `git.diffStaged(repoPath)` | `string` | `string` | Staged diff |
| `git:diff-file` | `git.diffFile(repoPath, filePath)` | `string, string` | `string` | Diff for a single file |
| `git:stage` | `git.stage(repoPath, files)` | `string, string[]` | `void` | Stage specific files |
| `git:unstage` | `git.unstage(repoPath, files)` | `string, string[]` | `void` | Unstage specific files (git reset HEAD) |
| `git:stage-all` | `git.stageAll(repoPath)` | `string` | `void` | Stage all changes (git add .) |
| `git:commit` | `git.commit(repoPath, message)` | `string, string` | `string` | Commit staged changes, returns commit hash |
| `git:branches` | `git.branches(repoPath)` | `string` | `{current, all, branches}` | List local branches |
| `git:checkout` | `git.checkout(repoPath, branch)` | `string, string` | `void` | Switch to branch |
| `git:create-branch` | `git.createBranch(repoPath, branch)` | `string, string` | `void` | Create and checkout new branch |
| `git:log` | `git.log(repoPath, maxCount?)` | `string, number?` | `{total, latest, all}` | Commit log (default 50, renderer requests 30) |
| `git:current-branch` | `git.currentBranch(repoPath)` | `string` | `string` | Current branch name |
| `git:is-repo` | `git.isRepo(repoPath)` | `string` | `boolean` | Check if path is a git repository |
| `git:file-content` | `git.fileContent(repoPath, filePath, ref?)` | `string, string, string?` | `string` | Get file content at a ref (default HEAD) |
| `git:pull` | `git.pull(repoPath)` | `string` | `void` | Pull from remote |
| `git:push` | `git.push(repoPath)` | `string` | `void` | Push to remote (auto-sets upstream if needed) |

#### Git Status Return Shape

```typescript
{
  not_added: string[]      // Untracked files
  conflicted: string[]     // Merge conflicts
  created: string[]        // Newly created (staged)
  deleted: string[]        // Deleted files
  modified: string[]       // Modified files (unstaged)
  renamed: string[]        // Renamed files
  staged: string[]         // All staged files
  files: Array<{           // All files with index/working_dir status codes
    path: string
    index: string          // Status in index: 'M', 'A', 'D', '?', ' '
    working_dir: string    // Status in working dir
  }>
  ahead: number            // Commits ahead of remote
  behind: number           // Commits behind remote
  current: string          // Current branch name
  tracking: string | null  // Remote tracking branch
  detached: boolean        // Detached HEAD state
  isClean: boolean         // Working directory clean?
}
```

---

### Project Operations (`db:projects:*`)

**IPC file**: `src/main/ipc/db.ipc.ts`
**Service**: `src/main/services/db.service.ts`
**Renderer access**: `window.api.projects.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `db:projects:all` | `projects.all()` | none | `Project[]` | List all projects |
| `db:projects:get` | `projects.get(id)` | `number` | `Project \| undefined` | Get project by ID |
| `db:projects:add` | `projects.add(name, path)` | `string, string` | `Project` | Add new project |
| `db:projects:remove` | `projects.remove(id)` | `number` | `void` | Remove project (cascade) |
| `db:projects:touch` | `projects.touch(id)` | `number` | `void` | Update last_opened_at |

---

### Review Operations (`db:reviews:*`)

**IPC file**: `src/main/ipc/review.ipc.ts`
**Service**: `src/main/services/db.service.ts`
**Renderer access**: `window.api.reviews.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `db:reviews:by-project` | `reviews.byProject(projectId)` | `number` | `Review[]` | All reviews for a project |
| `db:reviews:get` | `reviews.get(id)` | `number` | `Review \| undefined` | Get review by ID |
| `db:reviews:create` | `reviews.create(projectId, branch, baseCommit)` | `number, string, string\|null` | `Review` | Create draft review |
| `db:reviews:submit` | `reviews.submit(id)` | `number` | `Review` | Mark review as submitted |
| `db:reviews:delete` | `reviews.delete(id)` | `number` | `void` | Delete review (cascade) |

---

### Comment Operations (`db:comments:*`)

**IPC file**: `src/main/ipc/review.ipc.ts`
**Service**: `src/main/services/db.service.ts`
**Renderer access**: `window.api.comments.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `db:comments:by-review` | `comments.byReview(reviewId)` | `number` | `ReviewComment[]` | All comments for a review |
| `db:comments:add` | `comments.add(reviewId, filePath, startLine, endLine, side, comment, severity)` | `number, string, number, number, string, string, string` | `ReviewComment` | Add new comment |
| `db:comments:update` | `comments.update(id, comment, severity)` | `number, string, string` | `ReviewComment` | Update comment text + severity |
| `db:comments:delete` | `comments.delete(id)` | `number` | `void` | Delete comment |

---

### Settings Operations (`db:settings:*`)

**IPC file**: `src/main/ipc/db.ipc.ts`
**Service**: `src/main/services/db.service.ts`
**Renderer access**: `window.api.settings.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `db:settings:get` | `settings.get(key)` | `string` | `string \| null` | Get a setting value |
| `db:settings:set` | `settings.set(key, value)` | `string, string` | `void` | Set a setting (upsert) |
| `db:settings:all` | `settings.all()` | none | `Record<string, string>` | Get all settings |

---

### Export Operations (`export:*`)

**IPC file**: `src/main/ipc/export.ipc.ts`
**Service**: `src/main/services/export.service.ts`
**Renderer access**: `window.api.export.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `export:markdown` | `export.markdown(reviewId)` | `number` | `{success, path}` | Export review as Markdown via save dialog |
| `export:markdown-to-path` | `export.markdownToPath(reviewId, exportPath)` | `number, string` | `{success, path}` | Export to a specific directory (auto-named) |
| `export:markdown-content` | `export.markdownContent(reviewId)` | `number` | `string` | Get Markdown string without saving |

---

### AI Operations (`ai:*`)

**IPC file**: `src/main/ipc/ai.ipc.ts`
**Service**: `src/main/services/ai.service.ts`
**Renderer access**: `window.api.ai.*`

| Channel | Renderer Method | Args | Returns | Description |
|---------|----------------|------|---------|-------------|
| `ai:generate-commit-message` | `ai.generateCommitMessage(repoPath)` | `string` | `string` | Generate conventional commit message from staged diff |
| `ai:rephrase-comment` | `ai.rephraseComment(text, severity)` | `string, string` | `string` | Rephrase a review comment using AI |

---

### Dialog Operations (`dialog:*`)

**Registered inline in**: `src/main/index.ts`
**Renderer access**: `window.api.dialog.*`

| Channel | Renderer Method | Returns | Description |
|---------|----------------|---------|-------------|
| `dialog:open-directory` | `dialog.openDirectory()` | `string \| null` | Native folder picker dialog |
| `dialog:select-export-dir` | `dialog.selectExportDir()` | `string \| null` | Native folder picker for export directory |

---

### Shell Operations (`shell:*`)

**Registered inline in**: `src/main/index.ts`
**Renderer access**: `window.api.shell.*`

| Channel | Renderer Method | Args | Description |
|---------|----------------|------|-------------|
| `shell:open-external` | `shell.openExternal(url)` | `string` | Open URL in system default browser |
