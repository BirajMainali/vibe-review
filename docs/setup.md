# Development Setup & Build Configuration

## Prerequisites

- **Node.js** 18+ (required for native `fetch` in AI service)
- **npm** (comes with Node.js)
- **Git** (installed and available in PATH)
- **Build tools** for native modules:
  - Linux: `build-essential`, `python3`
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools / windows-build-tools

The `better-sqlite3` package includes a native C++ addon that requires compilation during `npm install`.

---

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd ai-code-review

# Install dependencies (including native module compilation)
npm install

# Start in development mode (hot-reload for renderer)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `electron-vite dev` | Start Electron with Vite dev server (HMR for renderer) |
| `build` | `electron-vite build` | Build all three targets (main/preload/renderer) to `out/` |
| `preview` | `electron-vite preview` | Preview the production build |
| `postinstall` | `electron-builder install-app-deps` | Auto-runs after `npm install` to rebuild native deps for Electron |

---

## Build Tooling

### electron-vite

**Config**: `electron.vite.config.ts`

electron-vite provides separate Vite configurations for three build targets:

```typescript
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]   // Don't bundle node_modules for main process
  },
  preload: {
    plugins: [externalizeDepsPlugin()]   // Don't bundle node_modules for preload
  },
  renderer: {
    resolve: {
      alias: { '@': resolve('src/renderer') }  // @ alias for renderer imports
    },
    plugins: [vue(), tailwindcss()]      // Vue SFC compilation + Tailwind CSS
  }
})
```

**Output**: All compiled files go to `out/`:
- `out/main/index.js` — Main process bundle
- `out/preload/index.js` — Preload script bundle
- `out/renderer/` — Static HTML + JS/CSS assets

### externalizeDepsPlugin

For the main and preload targets, `externalizeDepsPlugin()` ensures that `node_modules` packages (like `better-sqlite3`, `simple-git`) are NOT bundled — they're required at runtime from `node_modules`. This is necessary because native modules can't be bundled by Vite.

---

## TypeScript Configuration

### Root (`tsconfig.json`)
References two project configs:
- `tsconfig.node.json` — Main + preload (Node.js environment)
- `tsconfig.web.json` — Renderer (browser/Vue environment)

### Node Config (`tsconfig.node.json`)
- Target: ESNext
- Module: ESNext with bundler resolution
- Types: `electron-vite/node`
- Includes: `src/main/**/*`, `src/preload/**/*`, `electron.vite.config.ts`
- Strict mode enabled

### Web Config (`tsconfig.web.json`)
- Target: ESNext
- Module: ESNext with bundler resolution
- JSX: preserve (for Vue templates)
- Path alias: `@/*` → `./src/renderer/*`
- Includes: `src/renderer/**/*`, `src/renderer/**/*.vue`
- Strict mode enabled

### Type Declarations

**`src/preload/index.d.ts`** — Declares `window.api: Api` globally so the renderer can use it with full type safety.

**`src/renderer/env.d.ts`** — Vite client types + Vue SFC module declaration + `window.api` type.

---

## Electron Builder Configuration

**Config**: `electron-builder.yml`

```yaml
appId: com.vibe-review.app
productName: Vibe Review
directories:
  buildResources: build
```

### Build Targets by Platform

| Platform | Targets | Category |
|----------|---------|----------|
| Linux | AppImage, deb | Development |
| macOS | dmg, zip | — |
| Windows | nsis (installer), zip | — |

### Excluded Files

The following are excluded from the distribution package:
- `.vscode/`, `src/` (source code — only `out/` is included)
- Config files: `electron.vite.config.*`, `tsconfig*.json`
- Lint/formatting configs
- Documentation files

### Build Resources

The `build/` directory contains build-time resources:
- `build/icon.png` — App icon used during build
- `resources/icon.png` — Runtime app icon (referenced in `src/main/index.ts`)

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@electron-toolkit/preload` | ^3.0.2 | Preload script utilities |
| `@electron-toolkit/utils` | ^4.0.0 | Electron main process utilities (`is.dev`, `optimizer`) |
| `better-sqlite3` | ^11.7.0 | Synchronous SQLite database (native addon) |
| `diff2html` | ^3.4.48 | Parse unified diffs into structured file/block/line objects |
| `simple-git` | ^3.27.0 | Programmatic Git operations |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/vite` | ^4.0.0 | Tailwind CSS Vite plugin |
| `@vitejs/plugin-vue` | ^5.2.1 | Vue SFC compilation for Vite |
| `electron` | ^33.2.1 | Electron runtime |
| `electron-builder` | ^25.1.8 | Package and distribute Electron apps |
| `electron-vite` | ^5.0.0 | Vite integration for Electron (3-target build) |
| `pinia` | ^2.3.0 | Vue state management |
| `tailwindcss` | ^4.0.0 | Utility-first CSS framework |
| `typescript` | ^5.7.3 | TypeScript compiler |
| `vite` | ^6.0.0 | Build tool and dev server |
| `vue` | ^3.5.13 | Frontend framework |
| `vue-router` | ^4.5.0 | Client-side routing |

---

## Environment & Runtime

### Development Mode

When `npm run dev` is running:
- Vite serves the renderer with HMR at a local URL
- `process.env.ELECTRON_RENDERER_URL` is set by electron-vite
- Main process loads from this URL: `mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])`
- Changes to renderer files trigger hot-reload
- Changes to main/preload require a restart

### Production Mode

When built (`npm run build`):
- Renderer is bundled as static assets in `out/renderer/`
- Main process loads the HTML file: `mainWindow.loadFile(join(__dirname, '../renderer/index.html'))`
- `is.dev` from `@electron-toolkit/utils` is `false`

### Data Storage Location

The SQLite database is stored at:
- **Linux**: `~/.config/vibe-review/code-review.db`
- **macOS**: `~/Library/Application Support/vibe-review/code-review.db`
- **Windows**: `%APPDATA%/vibe-review/code-review.db`

This path is determined by `app.getPath('userData')` in Electron.

---

## Window Configuration

**Source**: `src/main/index.ts`

```typescript
const mainWindow = new BrowserWindow({
  width: 1400,        // Default window size
  height: 900,
  minWidth: 1000,     // Minimum window size
  minHeight: 700,
  show: false,        // Hidden until ready-to-show
  title: 'Vibe Review',
  icon,               // From resources/icon.png
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false     // Required for native modules (better-sqlite3)
  }
})
```

**Behaviors**:
- Window hidden until `ready-to-show` event (prevents white flash)
- External links open in system browser (`shell.openExternal`)
- `app.on('activate')` creates window if none exist (macOS dock click)
- Database closed on `window-all-closed` event
- App quits on all windows closed (except macOS)

---

## .gitignore

```
node_modules/
out/
dist/
*.db
*.db-journal
*.db-wal
.DS_Store
```

Note: `out/` is currently committed to the repo (build artifacts). The `.gitignore` excludes it for future builds, but existing `out/` files remain in the repo history.
