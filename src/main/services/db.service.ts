import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { SCHEMA_SQL } from '../database/schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'code-review.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema(): void {
  db!.exec(SCHEMA_SQL)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

// --- Project queries ---

export interface Project {
  id: number
  name: string
  path: string
  last_opened_at: string | null
  created_at: string
}

export function getAllProjects(): Project[] {
  return getDb().prepare('SELECT * FROM projects ORDER BY last_opened_at DESC, created_at DESC').all() as Project[]
}

export function getProjectById(id: number): Project | undefined {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined
}

export function addProject(name: string, projectPath: string): Project {
  const stmt = getDb().prepare('INSERT INTO projects (name, path) VALUES (?, ?)')
  const result = stmt.run(name, projectPath)
  return getProjectById(result.lastInsertRowid as number)!
}

export function removeProject(id: number): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
}

export function touchProject(id: number): void {
  getDb().prepare('UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
}

// --- Review queries ---

export interface Review {
  id: number
  project_id: number
  branch: string
  base_commit: string | null
  status: string
  created_at: string
  submitted_at: string | null
}

export function getReviewsByProject(projectId: number): Review[] {
  return getDb()
    .prepare('SELECT * FROM reviews WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as Review[]
}

export function getReviewById(id: number): Review | undefined {
  return getDb().prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Review | undefined
}

export function createReview(projectId: number, branch: string, baseCommit: string | null): Review {
  const stmt = getDb().prepare('INSERT INTO reviews (project_id, branch, base_commit) VALUES (?, ?, ?)')
  const result = stmt.run(projectId, branch, baseCommit)
  return getReviewById(result.lastInsertRowid as number)!
}

export function submitReview(id: number): Review {
  getDb()
    .prepare("UPDATE reviews SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(id)
  return getReviewById(id)!
}

export function deleteReview(id: number): void {
  getDb().prepare('DELETE FROM reviews WHERE id = ?').run(id)
}

// --- Review comment queries ---

export interface ReviewComment {
  id: number
  review_id: number
  file_path: string
  start_line: number
  end_line: number
  side: string
  comment: string
  severity: string
  created_at: string
}

export function getCommentsByReview(reviewId: number): ReviewComment[] {
  return getDb()
    .prepare('SELECT * FROM review_comments WHERE review_id = ? ORDER BY file_path, start_line')
    .all(reviewId) as ReviewComment[]
}

export function addComment(
  reviewId: number,
  filePath: string,
  startLine: number,
  endLine: number,
  side: string,
  comment: string,
  severity: string
): ReviewComment {
  const stmt = getDb().prepare(
    'INSERT INTO review_comments (review_id, file_path, start_line, end_line, side, comment, severity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const result = stmt.run(reviewId, filePath, startLine, endLine, side, comment, severity)
  return getDb().prepare('SELECT * FROM review_comments WHERE id = ?').get(result.lastInsertRowid as number) as ReviewComment
}

export function updateComment(id: number, comment: string, severity: string): ReviewComment {
  getDb().prepare('UPDATE review_comments SET comment = ?, severity = ? WHERE id = ?').run(comment, severity, id)
  return getDb().prepare('SELECT * FROM review_comments WHERE id = ?').get(id) as ReviewComment
}

export function deleteComment(id: number): void {
  getDb().prepare('DELETE FROM review_comments WHERE id = ?').run(id)
}

// --- Settings queries ---

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return settings
}
