# Backend Services

All services run in the Electron **main process** (Node.js environment) and are accessed from the renderer exclusively through IPC.

---

## Git Service

**Source**: `src/main/services/git.service.ts`
**Dependency**: `simple-git` (^3.27.0)

### How It Works

Each function creates a fresh `SimpleGit` instance scoped to a repository path:

```typescript
function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath)
}
```

This is stateless — no persistent git connection is held. Each call is independent.

### Functions

#### `getStatus(repoPath: string)`
Returns a **plain serializable object** (not the raw `StatusResult` from simple-git, which contains non-serializable methods like `isClean()`). The `isClean` property is pre-computed as a boolean.

Fields returned: `not_added`, `conflicted`, `created`, `deleted`, `modified`, `renamed`, `staged`, `files` (array of `{path, index, working_dir}`), `ahead`, `behind`, `current`, `tracking`, `detached`, `isClean`.

#### `getDiff(repoPath: string): Promise<string>`
Returns unstaged diff in unified format (`git diff`).

#### `getDiffStaged(repoPath: string): Promise<string>`
Returns staged diff (`git diff --staged`).

#### `getDiffFile(repoPath: string, filePath: string): Promise<string>`
Diff for a single file (`git diff -- <file>`).

#### `stageFiles(repoPath: string, files: string[]): Promise<void>`
Stages specific files (`git add <files>`).

#### `unstageFiles(repoPath: string, files: string[]): Promise<void>`
Unstages specific files (`git reset HEAD -- <files>`).

#### `stageAll(repoPath: string): Promise<void>`
Stages everything (`git add .`).

#### `commit(repoPath: string, message: string): Promise<string>`
Commits staged changes, returns the commit hash.

#### `getBranches(repoPath: string)`
Returns local branches with current, all names, and branch details. Serializes to plain objects (strips non-serializable properties).

#### `checkout(repoPath: string, branch: string): Promise<void>`
Switches to an existing branch.

#### `createBranch(repoPath: string, branch: string): Promise<void>`
Creates and checks out a new local branch (`git checkout -b`).

#### `getLog(repoPath: string, maxCount = 50)`
Returns commit log. Each entry includes `hash`, `date`, `message`, `author_name`. The renderer requests 30 entries.

#### `getFileContent(repoPath: string, filePath: string, ref = 'HEAD'): Promise<string>`
Returns file content at a given ref using `git show <ref>:<path>`. Returns empty string on error (e.g., file doesn't exist at that ref).

#### `getCurrentBranch(repoPath: string): Promise<string>`
Returns current branch name, or `'HEAD'` if detached.

#### `pull(repoPath: string): Promise<void>`
Pulls from the tracking remote.

#### `push(repoPath: string): Promise<void>`
Pushes to remote. **Smart upstream handling**: if push fails with "no upstream", automatically runs `git push -u origin <branch>`.

#### `isGitRepo(repoPath: string): Promise<boolean>`
Checks if a path is inside a valid git repository. Used when adding new projects.

---

## AI Service

**Source**: `src/main/services/ai.service.ts`
**Dependency**: Native `fetch` API (Node.js 18+)

### Overview

The AI service makes HTTP requests to an **OpenAI-compatible chat completions endpoint**. It supports:
- OpenAI (`https://api.openai.com/v1`)
- Azure OpenAI
- OpenRouter
- Any provider implementing the `/chat/completions` API

### Configuration

AI configuration is stored in the SQLite `settings` table:
- `openai_base_url` — Base URL (e.g., `https://api.openai.com/v1`)
- `openai_api_key` — Bearer token
- `openai_model` — Model name (default: `gpt-4o-mini`)

Settings are read from the database at call time in `ai.ipc.ts`, not cached.

### Functions

#### `generateCommitMessage(diff, baseUrl, apiKey, model): Promise<string>`

Generates a conventional commit message from a staged diff.

**System prompt**:
> Generate a single-line conventional commit message (type(scope): description) for the given diff. Use feat, fix, docs, style, refactor, test, chore, or perf. Be concise. Output ONLY the commit message, no quotes or formatting.

**Parameters**:
- `max_tokens`: 150
- `temperature`: 0.3

**Diff truncation**: The diff is truncated to 6000 characters in `ai.ipc.ts` before being sent to avoid token limits (~2k tokens).

**Post-processing**: Takes only the first line of the response and trims whitespace.

#### `rephraseComment(text, severity, baseUrl, apiKey, model): Promise<string>`

Rephrases a review comment to be clearer and more professional, adapting tone to severity.

**System prompt**:
> Rephrase the given code review comment to be clearer and more professional. Keep the same meaning and intent. The comment's severity type is provided for context — adapt the tone accordingly (e.g. a "bug" should sound more urgent, a "nitpick" should be gentle, a "suggestion" should be constructive, a "question" should be inquisitive). Output ONLY the rephrased text, no quotes or extra formatting.

**Parameters**:
- `max_tokens`: 300
- `temperature`: 0.3

**Fallback**: If the AI returns empty content, the original text is returned unchanged.

### Response Parsing

Both functions use a resilient response parser that handles multiple API response formats:

```typescript
// Handles standard OpenAI format
const choices = data.choices
const content = choices[0].message.content

// Also handles: data.data.choices, delta format, text format, array content
```

### Error Handling

- Missing base URL or API key → throws descriptive error
- HTTP non-200 → parses error body for `error.message` or `message` field
- Empty AI response → throws "AI returned empty content. Try a different model."

---

## Export Service

**Source**: `src/main/services/export.service.ts`

### `generateMarkdown(project, review, comments): string`

Generates a formatted Markdown document from review data.

#### Markdown Structure

```markdown
# Vibe Review: {project.name}

**Branch**: {branch} | **Date**: {date} | **Reviewer**: Self-Review

## Summary

- **Total Comments**: {count}
- Bugs: {n} | Suggestions: {n} | Nitpicks: {n} | Questions: {n}

---

## Files Reviewed

### `{file_path}`

**Line {n}** | Severity: **{Severity}**

{comment text}

---

### `{another_file}`
...
```

#### Features
- Comments grouped by file path
- Line ranges displayed (single line or range)
- Severity counts in summary
- Date formatted in US locale (e.g., "February 12, 2026, 03:45 PM")
- Uses `submitted_at` date if available, otherwise `created_at`

---

## Database Service

**Source**: `src/main/services/db.service.ts`

See [database.md](./database.md) for full documentation.

### Key Implementation Details

- **Singleton pattern**: `getDb()` creates the database connection once, subsequent calls return the same instance
- **Lazy initialization**: Database is created on first access, not at app startup
- **WAL mode**: Enables concurrent reads while writing (`PRAGMA journal_mode = WAL`)
- **Synchronous API**: `better-sqlite3` is synchronous by design (no async/await needed for queries), but IPC handlers are async to match Electron's invoke pattern
- **Schema migration**: Currently uses `CREATE TABLE IF NOT EXISTS` — no formal migration system. Schema changes require manual migration or database reset.

---

## Service → IPC Mapping

| Service | IPC File | Channels |
|---------|----------|----------|
| `git.service.ts` | `git.ipc.ts` | `git:*` (18 channels) |
| `db.service.ts` | `db.ipc.ts` | `db:projects:*`, `db:settings:*` |
| `db.service.ts` | `review.ipc.ts` | `db:reviews:*`, `db:comments:*` |
| `ai.service.ts` | `ai.ipc.ts` | `ai:*` (2 channels) |
| `export.service.ts` | `export.ipc.ts` | `export:*` (3 channels) |

The IPC layer is intentionally thin — it only reads settings from the database (for AI config), delegates to the appropriate service function, and returns the result. No business logic lives in the IPC handlers.
