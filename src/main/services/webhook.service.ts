import type { Review, ReviewComment, Project } from './db.service'

export interface WebhookPayload {
  event: string
  repository: {
    name: string
    path: string
    branch: string
  }
  review: {
    id: number
    created_at: string
    submitted_at: string | null
    comments: Array<{
      file: string
      start_line: number
      end_line: number
      severity: string
      comment: string
    }>
  }
  summary: {
    total: number
    bugs: number
    suggestions: number
    nitpicks: number
    questions: number
  }
}

export function buildPayload(
  project: Project,
  review: Review,
  comments: ReviewComment[]
): WebhookPayload {
  const severityCounts = { bug: 0, suggestion: 0, nitpick: 0, question: 0 }
  for (const c of comments) {
    if (c.severity in severityCounts) {
      severityCounts[c.severity as keyof typeof severityCounts]++
    }
  }

  return {
    event: 'review.submitted',
    repository: {
      name: project.name,
      path: project.path,
      branch: review.branch
    },
    review: {
      id: review.id,
      created_at: review.created_at,
      submitted_at: review.submitted_at,
      comments: comments.map((c) => ({
        file: c.file_path,
        start_line: c.start_line,
        end_line: c.end_line,
        severity: c.severity,
        comment: c.comment
      }))
    },
    summary: {
      total: comments.length,
      bugs: severityCounts.bug,
      suggestions: severityCounts.suggestion,
      nitpicks: severityCounts.nitpick,
      questions: severityCounts.question
    }
  }
}

export async function sendWebhook(url: string, payload: WebhookPayload): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const body = await response.text()
    return { ok: response.ok, status: response.status, body }
  } catch (err: any) {
    return { ok: false, status: 0, body: err.message || 'Network error' }
  }
}

export async function testWebhook(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  const testPayload: WebhookPayload = {
    event: 'review.test',
    repository: { name: 'test-repo', path: '/test/path', branch: 'main' },
    review: {
      id: 0,
      created_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      comments: []
    },
    summary: { total: 0, bugs: 0, suggestions: 0, nitpicks: 0, questions: 0 }
  }
  return sendWebhook(url, testPayload)
}
