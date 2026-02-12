# Frontend Documentation

## Overview

The frontend is a **Vue 3** single-page application rendered inside Electron's BrowserWindow. It uses:

- **Composition API** with `<script setup>` syntax throughout
- **Pinia** for state management (4 stores)
- **Vue Router 4** with in-memory history (no URL bar in Electron)
- **Tailwind CSS 4** for styling with dark mode support
- **diff2html** for parsing unified diffs into structured data

**Entry point**: `src/renderer/main.ts` → mounts `App.vue` with Pinia + Router

---

## Routing

**Source**: `src/renderer/router/index.ts`

Uses `createMemoryHistory()` (appropriate for Electron — no browser URL bar).

| Path | Name | Component | Props | Description |
|------|------|-----------|-------|-------------|
| `/` | `dashboard` | `DashboardView.vue` | — | Project list/grid (home page) |
| `/review/:projectId` | `review` | `ReviewView.vue` | `projectId` | Main review workspace |
| `/history/:projectId` | `review-history` | `ReviewHistoryView.vue` | `projectId` | Past reviews for a project |
| `/settings` | `settings` | `SettingsView.vue` | — | App configuration |

All views are **lazy-loaded** via dynamic imports.

---

## Pinia Stores

### Project Store

**Source**: `src/renderer/stores/project.store.ts`

Manages the list of registered Git repositories.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `projects` | `Project[]` | All registered projects |
| `currentProject` | `Project \| null` | Currently selected project |
| `loading` | `boolean` | Loading state |

#### Computed

| Property | Description |
|----------|-------------|
| `sortedProjects` | Projects sorted by last_opened_at DESC, then created_at DESC |

#### Actions

| Method | Description |
|--------|-------------|
| `fetchProjects()` | Load all projects from database |
| `addProject()` | Open native folder picker → validate git repo → add to DB → return project |
| `removeProject(id)` | Delete project from DB and local state |
| `selectProject(project)` | Set as current + touch (update last_opened_at) |

**Key behavior in `addProject()`**: Validates the selected folder is a git repository before adding. Derives the project name from the folder name.

---

### Git Store

**Source**: `src/renderer/stores/git.store.ts`

Manages all Git-related state for the currently active repository.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `currentBranch` | `string` | Current branch name |
| `branches` | `BranchInfo` | `{ current, all: string[] }` |
| `status` | `any` | Full git status object |
| `diffOutput` | `string` | Unstaged diff string |
| `diffStagedOutput` | `string` | Staged diff string |
| `log` | `LogEntry[]` | Recent commit log |
| `loading` | `boolean` | General loading state |
| `pulling` | `boolean` | Pull operation in progress |
| `pushing` | `boolean` | Push operation in progress |
| `staging` | `boolean` | Stage/unstage operation in progress |

#### Actions

| Method | Description |
|--------|-------------|
| `fetchStatus(repoPath)` | Refresh git status |
| `fetchDiff(repoPath)` | Refresh unstaged diff |
| `fetchDiffStaged(repoPath)` | Refresh staged diff |
| `fetchBranches(repoPath)` | Refresh branch list |
| `fetchLog(repoPath)` | Refresh commit log (30 entries) |
| `stageFiles(repoPath, files)` | Stage specific files → refresh status |
| `unstageFiles(repoPath, files)` | Unstage specific files → refresh status |
| `stageAll(repoPath)` | Stage all → refresh status |
| `commitChanges(repoPath, message)` | Commit → `refreshAll()` |
| `checkoutBranch(repoPath, branch)` | Checkout → refresh status + branches + diff |
| `createBranch(repoPath, branch)` | Create + checkout → refresh branches |
| `pullBranch(repoPath)` | Pull → `refreshAll()` |
| `pushBranch(repoPath)` | Push → `refreshAll()` |
| `refreshAll(repoPath)` | Parallel refresh of status + diff + diffStaged + branches + log |

**Key behavior**: `refreshAll()` runs all five fetch operations in parallel via `Promise.all()`.

---

### Review Store

**Source**: `src/renderer/stores/review.store.ts`

Manages the current review session and its comments.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `currentReview` | `Review \| null` | Active review |
| `comments` | `ReviewComment[]` | Comments for current review |
| `reviews` | `Review[]` | All reviews for current project |
| `loading` | `boolean` | Loading state |

#### Computed

| Property | Description |
|----------|-------------|
| `commentsByFile` | `Record<string, ReviewComment[]>` — comments grouped by file path |
| `severityCounts` | `{ bug, suggestion, nitpick, question }` — count per severity |

#### Actions

| Method | Description |
|--------|-------------|
| `fetchReviews(projectId)` | Load all reviews for a project |
| `startReview(projectId, branch, baseCommit)` | Create new draft review + clear comments |
| `loadReview(reviewId)` | Load existing review + its comments |
| `addComment(filePath, startLine, endLine, side, comment, severity)` | Add comment to current review |
| `updateComment(id, comment, severity)` | Update comment text and severity |
| `deleteComment(id)` | Delete a comment |
| `submitReview()` | Mark current review as submitted |
| `exportMarkdown()` | Export current review via save dialog |
| `deleteReview(id)` | Delete a review (clears current if matching) |
| `clearCurrent()` | Reset current review and comments |

---

### Settings Store

**Source**: `src/renderer/stores/settings.store.ts`

Manages application preferences persisted in the SQLite `settings` table.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `exportDir` | `string` | Export directory path |
| `darkMode` | `boolean` | Dark mode enabled |
| `openaiBaseUrl` | `string` | AI provider base URL |
| `openaiApiKey` | `string` | AI API key |
| `openaiModel` | `string` | AI model name |
| `deeplinkPlatformName` | `string` | Deeplink platform display name |
| `deeplinkUrl` | `string` | Deeplink URL template |
| `loading` | `boolean` | Loading state |

#### Actions

| Method | Description |
|--------|-------------|
| `loadSettings()` | Load all settings from DB, apply dark mode |
| `setExportDir(dir)` | Save export directory |
| `setOpenAIConfig(baseUrl, apiKey, model)` | Save AI configuration |
| `setDeeplinkConfig(platformName, url)` | Save deeplink configuration |
| `toggleDarkMode()` | Toggle + persist + apply dark mode |
| `applyDarkMode()` | Add/remove `.dark` class on `<html>` |

**App initialization**: `App.vue` calls `loadSettings()` on mount to restore theme and settings.

---

## Views

### DashboardView (`/`)

**Source**: `src/renderer/views/DashboardView.vue`

The home screen showing a grid of registered projects.

**Features**:
- Responsive grid (1/2/3 columns based on viewport)
- Add repository button → native folder picker → git repo validation
- Project cards show name, path, last opened date
- Hover reveals history and delete buttons
- Delete uses double-click confirmation (click once to arm, click again to confirm, auto-resets after 3s)
- Click a project → navigates to `/review/:projectId`

---

### ReviewView (`/review/:projectId`)

**Source**: `src/renderer/views/ReviewView.vue`

The main code review workspace. Most complex view in the app.

**Layout** (3-panel):

```
┌──────────┬─┬────────────────────────┬─┬──────────┐
│ Changes  │ │    Diff Viewer         │ │ Review   │
│ Panel    │▶│    (DiffViewer)        │◀│ Summary  │
│          │ │                        │ │ +        │
│ Staged/  │ │  [Comment Form]       │ │ Comment  │
│ Unstaged │ │  (ReviewPanel)        │ │ List     │
│ Files    │ │                        │ │          │
│          │ │                        │ │          │
│ Commit   │ │                        │ │          │
│ Area     │ │                        │ │          │
└──────────┴─┴────────────────────────┴─┴──────────┘
```

**Left panel (ChangesPanel)**: File staging checklist + commit form
**Center**: Diff viewer with inline comments
**Right panel**: Review summary (severity counts, export button) + comment list
**Both side panels**: Collapsible via toggle buttons

**Initialization flow**:
1. Load/select project from store
2. `gitStore.refreshAll()` — fetch status, diff, branches, log in parallel
3. Check for existing draft review → resume it, or create a new one
4. Display diff (prefers unstaged diff; falls back to staged diff if no unstaged changes)

**Key interactions**:
- Click line numbers → open comment form (ReviewPanel) at top of diff area
- Pull/Push buttons in TopBar
- "Export & Finish" → writes Markdown to export dir → optional deeplink to external tool

---

### ReviewHistoryView (`/history/:projectId`)

**Source**: `src/renderer/views/ReviewHistoryView.vue`

Lists all past reviews for a project.

**Features**:
- Reviews listed with branch name, status badge (draft/submitted), dates
- Expandable: click to load and show comments inline
- Each comment shows severity badge + file:line reference + text
- Export button per review (opens save dialog)
- Delete with double-click confirmation
- "New Review" button → navigates to ReviewView

---

### SettingsView (`/settings`)

**Source**: `src/renderer/views/SettingsView.vue`

Configuration page with four sections:

1. **Appearance**: Dark mode toggle (switch component)
2. **OpenAI / AI Provider**: Base URL, API Key (password input), Model name + Save button
3. **Export Directory**: Folder picker via native dialog (required for export)
4. **Deeplink**: Platform name + URL template with `{REVIEW_PATH}` placeholder, favicon preview

---

## Components

### Layout Components

#### `AppLayout.vue`
Root layout wrapper. Shows `AppTopBar` on non-review pages. Contains `<router-view>` with fade transitions.

#### `AppTopBar.vue`
Shown on Dashboard, Settings, and History pages. Left side: "Projects" back button (on settings/history). Right side: Settings gear icon.

#### `TopBar.vue`
Shown only on ReviewView. Contains:
- `RepoSwitcher` — dropdown to switch between projects
- `BranchSwitcher` — dropdown to switch/create branches
- `GitStatus` — colored dot indicators for staged/modified/deleted/untracked counts
- Pull/Push buttons with loading spinners
- Refresh button
- Settings button

---

### Diff Components

#### `DiffViewer.vue`
Top-level diff component. Takes a `diffString` prop, parses it with `diff2html.parse()`, and renders a `DiffFile` for each file in the diff.

**Props**: `diffString`, `reviewComments`, `readonly`
**Events**: `add-comment`

#### `DiffFile.vue`
Renders a single file's diff. Features:
- Collapsible file header (sticky) with file name + added/deleted line counts
- Line number selection: click to start, Shift+click to extend range
- Floating "Add Review Comment" button when lines are selected
- Inline comment display after the last line of each comment's range
- Flattens `DiffBlock[]` into a linear list of lines for rendering

**Selection model**:
- `selectionStart` / `selectionEnd` refs track the selected line range
- `selectedRange` computed gives `{ start, end, side }`
- Clicking "Add Comment" emits the range data to the parent

#### `DiffLine.vue`
Single table row in the diff. Renders:
- Old line number (left gutter)
- New line number (right gutter)
- Content with +/- prefix and color coding
- Click handler on gutters for line selection

**CSS classes**: `diff-line-add` (green), `diff-line-del` (red), `diff-line-hunk` (blue/gray), `diff-line-selected` (blue highlight)

#### `LineSelector.vue`
Documentation-only component (renders `<slot />`). Describes the selection model used by `DiffFile.vue`.

---

### Review Components

#### `ReviewPanel.vue`
Inline comment creation form. Appears at the top of the diff area when the user selects lines.

**Features**:
- Severity picker: Bug / Suggestion / Nitpick / Question (pill buttons)
- Textarea with `Ctrl+Enter` to save
- AI "Rephrase" button (sparkle icon, left of textarea) — calls `window.api.ai.rephraseComment()`
- Rephrase spinner + error display

**Props**: `filePath`, `startLine`, `endLine`, `side`
**Events**: `close`, `saved`

#### `ReviewSummary.vue`
Sticky summary widget in the right panel.

**Displays**: Total comment count + severity badges with counts
**Actions**: "Export & Finish" button (disabled if no export dir set)
**Deeplink support**: If configured, shows platform favicon and "Export & Finish in {Platform}" label

#### `CommentCard.vue`
Displays a single review comment. Used both inline in the diff and in the comment list.

**Features**:
- Header: severity badge (or dropdown when editing) + line range
- Body: comment text (whitespace-preserving)
- Edit mode: textarea + severity dropdown + Save/Cancel
- Delete with double-click confirmation

**Props**: `comment` (full comment object), `readonly`

#### `CommentList.vue`
Lists all comments for the current review, grouped by file path. Each file group has a monospace heading followed by `CommentCard` instances.

#### `SeverityBadge.vue`
Colored pill component for severity levels:
- **Bug**: Red background
- **Suggestion**: Blue background
- **Nitpick**: Yellow background
- **Question**: Purple background

---

### Git Components

#### `ChangesPanel.vue`
Left sidebar in ReviewView. The primary staging and commit interface.

**Sections**:
1. **Header**: "Select all" checkbox + changed file count
2. **File checklist**: Files categorized as Changed/Removed/New with color-coded badges
   - Each file has a checkbox (checked = staged)
   - Toggle individual files or all at once
3. **Commit area** (bottom):
   - Error display
   - Description textarea with AI sparkle button
   - AI button calls `window.api.ai.generateCommitMessage()` (requires staged files)
   - Commit button (Ctrl+Enter shortcut)

**File categorization logic**: Derives from `status.files` array, mapping index/working_dir status codes to Modified/Removed/Added categories.

#### `BranchSwitcher.vue`
Dropdown for branch operations.

**Features**:
- Displays current branch name
- Click to open dropdown with all local branches
- Current branch shown with checkmark
- "New branch" input at bottom
- Closes on outside click (document-level click listener)

#### `GitStatus.vue`
Compact status indicator showing colored dots with counts:
- Green: staged files
- Amber: modified files
- Rose: deleted files
- Emerald: untracked files

#### `RepoSwitcher.vue`
Dropdown for switching between registered repositories.

**Features**:
- Shows current project name
- Lists all projects with folder icon and path
- Click to switch (navigates to `/review/:projectId`)
- "Add repository" button at bottom
- Full-screen overlay click to close

#### `FileStager.vue`
Modal dialog for staging/unstaging files (alternative to ChangesPanel).

**Sections**:
- Staged files list with "Unstage" button per file
- Unstaged changes list with "Stage" button per file + "Stage All"
- Status icons: U (untracked), D (deleted), M (modified)

#### `CommitDialog.vue`
Modal commit dialog (legacy component — the commit form is now inline in ChangesPanel).

**Features**:
- Shows staged file count
- Warning if no files staged
- Commit message textarea with AI sparkle icon (placeholder — not wired up)
- Ctrl+Enter shortcut
- Cancel/Commit buttons

---

## Styling

**Source**: `src/renderer/assets/styles/main.css`

### Tailwind Configuration
- Uses Tailwind CSS 4 with `@import "tailwindcss"`
- Custom dark mode variant: `@custom-variant dark (&:where(.dark, .dark *))`
- Dark mode applied by adding/removing `.dark` class on `<html>` element

### Custom Styles

**Typography**:
- `body`: system-ui font stack
- `.code-font`: monospace font stack (used for diff viewer)

**Scrollbars** (Webkit):
- 8px width, transparent track, rounded thumb
- Light: `#cbd5e1` → `#94a3b8` on hover
- Dark: `#475569` → `#64748b` on hover

**Diff line colors**:
- `.diff-line-add`: green (`#dcfce7` light / `rgba(34,197,94,0.12)` dark)
- `.diff-line-del`: red (`#fee2e2` light / `rgba(239,68,68,0.12)` dark)
- `.diff-line-hunk`: blue/gray
- `.diff-line-selected`: blue highlight (`rgba(59,130,246,0.15/0.25)`)

**Transitions**:
- `.fade-*`: opacity 0.15s ease
- `.slide-*`: opacity + translateY 0.2s ease (used for comment form, expanded sections)

---

## Data Flow Example: Adding a Comment

1. **User** clicks line 42 in `DiffLine.vue` → emits `line-click(42, 'right', event)`
2. **DiffFile.vue** records `selectionStart = { line: 42, side: 'right' }`, shows "Add Comment" button
3. **User** clicks "Add Comment" → `DiffFile.vue` emits `add-comment({ filePath, startLine: 42, endLine: 42, side: 'right' })`
4. **ReviewView.vue** receives event → sets `commentFormData` → renders `ReviewPanel` inline
5. **User** selects severity "Bug", types comment, clicks "Add Comment"
6. **ReviewPanel.vue** calls `reviewStore.addComment('src/foo.ts', 42, 42, 'right', 'Potential null reference', 'bug')`
7. **Review Store** calls `window.api.comments.add(reviewId, 'src/foo.ts', 42, 42, 'right', 'Potential null reference', 'bug')`
8. **Preload** translates to `ipcRenderer.invoke('db:comments:add', ...)`
9. **Main process** handler in `review.ipc.ts` calls `dbService.addComment(...)`
10. **SQLite** inserts row → returns the new `ReviewComment`
11. **Review Store** pushes the new comment to `comments` array → reactivity updates UI
12. **DiffFile.vue** shows the comment inline after line 42
13. **CommentList.vue** (right panel) also shows the new comment grouped under `src/foo.ts`
