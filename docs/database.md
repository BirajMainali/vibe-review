# Database Documentation

## Overview

Vibe Review uses **SQLite** via the `better-sqlite3` npm package. The database file is stored in Electron's user data directory at:

```
{app.getPath('userData')}/code-review.db
```

On Linux, this typically resolves to `~/.config/vibe-review/code-review.db`.

### Connection Configuration

- **Journal mode**: WAL (Write-Ahead Logging) for concurrent read performance
- **Foreign keys**: Enabled (`PRAGMA foreign_keys = ON`)
- **Singleton**: Single `Database` instance created lazily via `getDb()`
- **Lifecycle**: Database is closed when all windows close (`closeDb()` in `app.on('window-all-closed')`)

**Source**: `src/main/services/db.service.ts`

---

## Schema

**Source**: `src/main/database/schema.ts`

### `projects` Table

Stores registered Git repository references.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique project ID |
| `name` | TEXT | NOT NULL | Display name (derived from folder name) |
| `path` | TEXT | NOT NULL UNIQUE | Absolute filesystem path to the repository |
| `last_opened_at` | DATETIME | nullable | Timestamp of last access (updated via `touch`) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | When the project was added |

### `reviews` Table

Stores review sessions. Each review belongs to a project and is tied to a Git branch.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique review ID |
| `project_id` | INTEGER | NOT NULL, FK → projects(id) ON DELETE CASCADE | Parent project |
| `branch` | TEXT | NOT NULL | Git branch name at time of review |
| `base_commit` | TEXT | nullable | Base commit hash (currently unused, reserved for future diff-against-commit) |
| `status` | TEXT | NOT NULL DEFAULT 'draft' | Either `'draft'` or `'submitted'` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | When the review was created |
| `submitted_at` | DATETIME | nullable | When the review was submitted/exported |

### `review_comments` Table

Individual review comments attached to specific line ranges in files.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique comment ID |
| `review_id` | INTEGER | NOT NULL, FK → reviews(id) ON DELETE CASCADE | Parent review |
| `file_path` | TEXT | NOT NULL | Relative file path within the repository |
| `start_line` | INTEGER | NOT NULL | First line of the commented range |
| `end_line` | INTEGER | NOT NULL | Last line of the commented range (same as start for single-line) |
| `side` | TEXT | NOT NULL DEFAULT 'right' | Which side of the diff: `'left'` (deleted) or `'right'` (added/context) |
| `comment` | TEXT | NOT NULL | The review comment text |
| `severity` | TEXT | NOT NULL DEFAULT 'suggestion' | One of: `'bug'`, `'suggestion'`, `'nitpick'`, `'question'` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | When the comment was created |

### `settings` Table

Key-value store for application configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Setting name |
| `value` | TEXT | nullable | Setting value (always stored as string) |

**Known setting keys:**

| Key | Example Value | Purpose |
|-----|---------------|---------|
| `dark_mode` | `"true"` / `"false"` | UI theme preference |
| `export_dir` | `"/home/user/reviews"` | Directory for Markdown exports |
| `openai_base_url` | `"https://api.openai.com/v1"` | AI provider endpoint |
| `openai_api_key` | `"sk-..."` | API authentication key |
| `openai_model` | `"gpt-4o-mini"` | Model name for AI calls |
| `deeplink_platform_name` | `"Cursor"` | Display name for deeplink button |
| `deeplink_url` | `"https://cursor.com/link/prompt?text={REVIEW_PATH}"` | URL template with `{REVIEW_PATH}` placeholder |

---

## Entity Relationships

```
projects (1) ──────< (many) reviews
reviews  (1) ──────< (many) review_comments
settings (standalone key-value store)
```

Cascade deletes ensure:
- Deleting a project removes all its reviews and their comments
- Deleting a review removes all its comments

---

## Database Service API

**Source**: `src/main/services/db.service.ts`

### Connection Management

| Function | Signature | Description |
|----------|-----------|-------------|
| `getDb()` | `() → Database` | Returns singleton DB connection (creates if needed, runs schema init) |
| `closeDb()` | `() → void` | Closes the database connection (called on app quit) |

### Project Queries

| Function | Signature | Description |
|----------|-----------|-------------|
| `getAllProjects()` | `() → Project[]` | All projects ordered by last_opened_at DESC, created_at DESC |
| `getProjectById(id)` | `(number) → Project \| undefined` | Single project by ID |
| `addProject(name, path)` | `(string, string) → Project` | Insert + return new project |
| `removeProject(id)` | `(number) → void` | Delete project (cascades to reviews/comments) |
| `touchProject(id)` | `(number) → void` | Update `last_opened_at` to now |

### Review Queries

| Function | Signature | Description |
|----------|-----------|-------------|
| `getReviewsByProject(projectId)` | `(number) → Review[]` | All reviews for a project, newest first |
| `getReviewById(id)` | `(number) → Review \| undefined` | Single review by ID |
| `createReview(projectId, branch, baseCommit)` | `(number, string, string\|null) → Review` | Create a new draft review |
| `submitReview(id)` | `(number) → Review` | Set status to `'submitted'`, set `submitted_at` |
| `deleteReview(id)` | `(number) → void` | Delete review (cascades to comments) |

### Comment Queries

| Function | Signature | Description |
|----------|-----------|-------------|
| `getCommentsByReview(reviewId)` | `(number) → ReviewComment[]` | All comments for a review, ordered by file_path + start_line |
| `addComment(reviewId, filePath, startLine, endLine, side, comment, severity)` | `(...) → ReviewComment` | Insert + return new comment |
| `updateComment(id, comment, severity)` | `(number, string, string) → ReviewComment` | Update comment text and severity |
| `deleteComment(id)` | `(number) → void` | Delete a single comment |

### Settings Queries

| Function | Signature | Description |
|----------|-----------|-------------|
| `getSetting(key)` | `(string) → string \| null` | Get single setting value |
| `setSetting(key, value)` | `(string, string) → void` | Upsert setting (INSERT OR REPLACE) |
| `getAllSettings()` | `() → Record<string, string>` | Get all settings as a key-value object |

---

## TypeScript Interfaces

```typescript
interface Project {
  id: number
  name: string
  path: string
  last_opened_at: string | null
  created_at: string
}

interface Review {
  id: number
  project_id: number
  branch: string
  base_commit: string | null
  status: string          // 'draft' | 'submitted'
  created_at: string
  submitted_at: string | null
}

interface ReviewComment {
  id: number
  review_id: number
  file_path: string
  start_line: number
  end_line: number
  side: string            // 'left' | 'right'
  comment: string
  severity: string        // 'bug' | 'suggestion' | 'nitpick' | 'question'
  created_at: string
}
```
