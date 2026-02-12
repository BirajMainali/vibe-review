# Vibe Review - Local Desktop App

A local, offline-first desktop application for self-reviewing code changes in git repositories. Built with Electron, Vue 3, and SQLite.

## Features

- **Multi-repository management** — Add multiple git-initialized folders and switch between them
- **GitHub-style diff viewer** — View unstaged code changes with unified diff formatting
- **Multi-line code review** — Click or shift-click line numbers to select ranges and add review comments
- **Severity labels** — Categorize comments as Bug, Suggestion, Nitpick, or Question
- **Git operations** — Stage/unstage files, commit, switch branches, create branches
- **Markdown export** — Export reviews as formatted Markdown files
- **Dark mode** — Toggle between light and dark themes
- **Review history** — Browse past reviews and their comments

## Tech Stack

- **Electron** — Desktop shell
- **Vue 3** — Frontend framework (Composition API)
- **Tailwind CSS 4** — Styling
- **Pinia** — State management
- **SQLite** (better-sqlite3) — Local database
- **simple-git** — Git operations
- **diff2html** — Diff parsing and rendering
- **electron-vite** — Build tooling

## Getting Started

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build
```

## Development

The project follows the `electron-vite` project structure:

- `src/main/` — Electron main process (Node.js), IPC handlers, services
- `src/preload/` — Preload script exposing APIs to the renderer via contextBridge
- `src/renderer/` — Vue 3 frontend app

### Key Files

| Path | Description |
|------|-------------|
| `src/main/services/db.service.ts` | SQLite database service with all queries |
| `src/main/services/git.service.ts` | Git operations via simple-git |
| `src/renderer/components/diff/` | Diff viewer components |
| `src/renderer/components/review/` | Review comment components |
| `src/renderer/views/ReviewView.vue` | Main review workspace |

## License

MIT
