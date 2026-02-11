import { ipcMain } from 'electron'
import * as dbService from '../services/db.service'
import { buildPayload, sendWebhook, testWebhook } from '../services/webhook.service'

export function registerWebhookIpc(): void {
  ipcMain.handle('webhook:send', async (_e, reviewId: number) => {
    const webhookUrl = dbService.getSetting('webhook_url')
    if (!webhookUrl) {
      return { ok: false, status: 0, body: 'No webhook URL configured' }
    }

    const review = dbService.getReviewById(reviewId)
    if (!review) throw new Error('Review not found')

    const project = dbService.getProjectById(review.project_id)
    if (!project) throw new Error('Project not found')

    const comments = dbService.getCommentsByReview(reviewId)
    const payload = buildPayload(project, review, comments)

    return sendWebhook(webhookUrl, payload)
  })

  ipcMain.handle('webhook:test', async (_e, url: string) => {
    return testWebhook(url)
  })
}
