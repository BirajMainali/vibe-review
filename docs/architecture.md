# Architecture Overview

## What Is Vibe Review?

Vibe Review is a **local, offline-first desktop application** for self-reviewing code changes in Git repositories. It provides a GitHub-style diff viewer with inline commenting, severity labels, Git operations (stage/unstage/commit/branch/push/pull), AI-assisted commit messages and comment rephrasing, and Markdown export of reviews.

It is **not** a SaaS or cloud service — everything runs locally on the user's machine with an embedded SQLite database.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Desktop Shell | Electron | ^33.2.1 | Cross-platform desktop app runtime |
| Build Tooling | electron-vite | ^5.0.0 | Vite-based build for Electron (main + preload + renderer) |
| Frontend Framework | Vue 3 | ^3.5.13 | Composition API, `<script setup>` SFCs |
| State Management | Pinia | ^2.3.0 | Reactive stores for git, review, project, settings |
| Styling | Tailwind CSS 4 | ^4.0.0 | Utility-first CSS with dark mode via `.dark` class |
| Router | Vue Router 4 | ^4.5.0 | In-memory history (no URL bar in Electron) |
| Database | better-sqlite3 | ^11.7.0 | Embedded SQLite with WAL mode |
| Git Integration | simple-git | ^3.27.0 | Programmatic git operations |
| Diff Parsing | diff2html | ^3.4.48 | Parse unified diffs into structured data |
| AI Integration | OpenAI-compatible API | (fetch-based) | Commit message generation & comment rephrasing |

---

## Process Architecture

Electron apps have three isolated process contexts:

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN PROCESS                         │
│  (Node.js — full filesystem & native module access)     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ git.service  │  │ db.service   │  │ ai.service   │  │
│  │ (simple-git) │  │ (sqlite3)    │  │ (fetch API)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────┴─────────────────┴──────────────────┴───────┐  │
│  │              IPC Handlers (ipcMain.handle)         │  │
│  │  git.ipc / db.ipc / review.ipc / ai.ipc / export  │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │ IPC (structured clone)
┌─────────────────────────┼───────────────────────────────┐
│               PRELOAD SCRIPT                            │
│  (contextBridge.exposeInMainWorld)                      │
│  Exposes `window.api` with typed methods                │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│              RENDERER PROCESS                           │
│  (Vue 3 app — browser sandbox)                          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pinia Stores (git / review / project / settings) │  │
│  │  ↕ window.api.* calls                             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Vue Components (views + components)              │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Vue Router (in-memory history)                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Renderer** calls `window.api.git.status(repoPath)` (defined in preload)
2. **Preload** translates to `ipcRenderer.invoke('git:status', repoPath)`
3. **Main** process handler in `git.ipc.ts` calls `gitService.getStatus(repoPath)`
4. Result is serialized via structured clone and returned to the renderer

---

## Directory Structure

```
ai-code-review/
├── docs/                          # Technical documentation (you are here)
├── build/                         # Build resources (app icon)
│   └── icon.png
├── resources/
│   └── icon.png                   # App icon referenced at runtime
├── out/                           # Compiled output (electron-vite build)
│   ├── main/index.js
│   ├── preload/index.js
│   └── renderer/                  # Bundled frontend assets
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # App entry — window creation, IPC registration
│   │   ├── database/
│   │   │   └── schema.ts          # SQL DDL for all tables
│   │   ├── ipc/
│   │   │   ├── git.ipc.ts         # Git operation IPC handlers
│   │   │   ├── db.ipc.ts          # Project + settings IPC handlers
│   │   │   ├── review.ipc.ts      # Review + comment IPC handlers
│   │   │   ├── ai.ipc.ts          # AI commit msg + rephrase IPC handlers
│   │   │   └── export.ipc.ts      # Markdown export IPC handlers
│   │   └── services/
│   │       ├── git.service.ts     # Git operations via simple-git
│   │       ├── db.service.ts      # SQLite queries (projects, reviews, comments, settings)
│   │       ├── ai.service.ts      # OpenAI-compatible API calls
│   │       └── export.service.ts  # Markdown generation from review data
│   ├── preload/
│   │   ├── index.ts               # contextBridge — exposes window.api
│   │   └── index.d.ts             # Global type declaration for window.api
│   └── renderer/                  # Vue 3 frontend
│       ├── index.html             # HTML entry point
│       ├── main.ts                # Vue app bootstrap (Pinia + Router)
│       ├── App.vue                # Root component — loads settings, mounts layout
│       ├── env.d.ts               # Vite + Vue + window.api type shims
│       ├── assets/styles/
│       │   └── main.css           # Tailwind import + custom diff/transition styles
│       ├── router/
│       │   └── index.ts           # Routes: dashboard, review, history, settings
│       ├── stores/
│       │   ├── project.store.ts   # Project CRUD + current project selection
│       │   ├── git.store.ts       # Git status, diff, branches, stage/commit/push/pull
│       │   ├── review.store.ts    # Review lifecycle + comment CRUD
│       │   └── settings.store.ts  # App settings (dark mode, AI config, export dir, deeplink)
│       ├── views/
│       │   ├── DashboardView.vue  # Project grid — add/remove/open repositories
│       │   ├── ReviewView.vue     # Main workspace — diff + changes + review panel
│       │   ├── ReviewHistoryView.vue # Past reviews list with expandable comments
│       │   └── SettingsView.vue   # Settings form (theme, AI, export, deeplink)
│       └── components/
│           ├── layout/
│           │   ├── AppLayout.vue      # Root layout — top bar + router-view
│           │   ├── AppTopBar.vue      # Top bar for non-review pages (projects/settings nav)
│           │   └── TopBar.vue         # Top bar for review page (repo switcher, branch, git ops)
│           ├── diff/
│           │   ├── DiffViewer.vue     # Parses diff string → renders DiffFile components
│           │   ├── DiffFile.vue       # Single file diff — line selection + inline comments
│           │   ├── DiffLine.vue       # Single diff line — old/new numbers + content + styling
│           │   └── LineSelector.vue   # Documentation component for selection model
│           ├── review/
│           │   ├── ReviewPanel.vue    # New comment form (severity picker, textarea, AI rephrase)
│           │   ├── ReviewSummary.vue  # Summary widget — counts, severity badges, export button
│           │   ├── CommentCard.vue    # Single comment — display, edit, delete
│           │   ├── CommentList.vue    # All comments grouped by file
│           │   └── SeverityBadge.vue  # Colored pill: Bug/Suggestion/Nitpick/Question
│           └── git/
│               ├── ChangesPanel.vue   # Left sidebar — file checklist, stage/unstage, commit
│               ├── BranchSwitcher.vue # Branch dropdown — switch/create branches
│               ├── GitStatus.vue      # Status indicators (staged/modified/deleted/untracked counts)
│               ├── RepoSwitcher.vue   # Repository dropdown — switch between projects
│               ├── FileStager.vue     # Modal for staging/unstaging individual files
│               └── CommitDialog.vue   # Modal commit form (legacy — replaced by ChangesPanel inline)
├── package.json
├── electron-builder.yml           # Electron Builder config (AppImage/deb/dmg/nsis)
├── electron.vite.config.ts        # Vite config for main/preload/renderer
├── tsconfig.json                  # Root TS config (references node + web)
├── tsconfig.node.json             # TS config for main + preload
└── tsconfig.web.json              # TS config for renderer (Vue SFCs)
```

---

## Key Design Decisions

### Offline-First
- All data stored in local SQLite (no network required for core functionality)
- AI features are optional and require user-configured API endpoint

### Security Model
- `sandbox: false` in webPreferences (needed for `simple-git` and `better-sqlite3` native modules)
- `contextBridge` isolates renderer from Node.js APIs — only `window.api` methods are exposed
- External URLs opened via `shell.openExternal` (prevents navigation away from app)

### State Management
- Four Pinia stores cover all app state: `project`, `git`, `review`, `settings`
- Stores call `window.api.*` methods which map to IPC → main process services
- No direct database or filesystem access from the renderer

### Dark Mode
- Implemented via Tailwind's `.dark` class variant on `<html>`
- Toggled through settings store → persisted in SQLite `settings` table
- Custom CSS variant: `@custom-variant dark (&:where(.dark, .dark *))`

### Review Workflow
1. User selects/adds a Git repository from the Dashboard
2. ReviewView opens: loads git status + diff, creates or resumes a draft review
3. User clicks line numbers in the diff to select ranges → adds comments with severity
4. AI can rephrase comments (optional, requires OpenAI config)
5. User stages files, optionally generates AI commit message, commits
6. "Export & Finish" writes review as Markdown to configured export directory
7. Optional deeplink opens the exported file in an external tool (e.g., Cursor)
