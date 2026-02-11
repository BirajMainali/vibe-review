import { ipcMain } from 'electron'
import * as dbService from '../services/db.service'

export function registerReviewIpc(): void {
  // --- Reviews ---
  ipcMain.handle('db:reviews:by-project', async (_e, projectId: number) => {
    return dbService.getReviewsByProject(projectId)
  })

  ipcMain.handle('db:reviews:get', async (_e, id: number) => {
    return dbService.getReviewById(id)
  })

  ipcMain.handle('db:reviews:create', async (_e, projectId: number, branch: string, baseCommit: string | null) => {
    return dbService.createReview(projectId, branch, baseCommit)
  })

  ipcMain.handle('db:reviews:submit', async (_e, id: number) => {
    return dbService.submitReview(id)
  })

  ipcMain.handle('db:reviews:delete', async (_e, id: number) => {
    dbService.deleteReview(id)
  })

  // --- Review Comments ---
  ipcMain.handle('db:comments:by-review', async (_e, reviewId: number) => {
    return dbService.getCommentsByReview(reviewId)
  })

  ipcMain.handle('db:comments:add', async (_e, reviewId: number, filePath: string, startLine: number, endLine: number, side: string, comment: string, severity: string) => {
    return dbService.addComment(reviewId, filePath, startLine, endLine, side, comment, severity)
  })

  ipcMain.handle('db:comments:update', async (_e, id: number, comment: string, severity: string) => {
    return dbService.updateComment(id, comment, severity)
  })

  ipcMain.handle('db:comments:delete', async (_e, id: number) => {
    dbService.deleteComment(id)
  })
}
