import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import * as dbService from '../services/db.service'
import { generateMarkdown } from '../services/export.service'

export function registerExportIpc(): void {
  ipcMain.handle('export:markdown', async (_e, reviewId: number) => {
    const review = dbService.getReviewById(reviewId)
    if (!review) throw new Error('Review not found')

    const project = dbService.getProjectById(review.project_id)
    if (!project) throw new Error('Project not found')

    const comments = dbService.getCommentsByReview(reviewId)
    const markdown = generateMarkdown(project, review, comments)

    const defaultName = `review-${project.name}-${review.branch}-${new Date().toISOString().slice(0, 10)}.md`

    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Review as Markdown',
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })

    if (filePath) {
      fs.writeFileSync(filePath, markdown, 'utf-8')
      return { success: true, path: filePath }
    }

    return { success: false, path: null }
  })

  ipcMain.handle('export:markdown-to-path', async (_e, reviewId: number, exportPath: string) => {
    const review = dbService.getReviewById(reviewId)
    if (!review) throw new Error('Review not found')

    const project = dbService.getProjectById(review.project_id)
    if (!project) throw new Error('Project not found')

    const comments = dbService.getCommentsByReview(reviewId)
    const markdown = generateMarkdown(project, review, comments)

    const fileName = `review-${project.name}-${review.branch}-${new Date().toISOString().slice(0, 10)}.md`
    const fullPath = path.join(exportPath, fileName)
    fs.writeFileSync(fullPath, markdown, 'utf-8')
    return { success: true, path: fullPath }
  })
}
