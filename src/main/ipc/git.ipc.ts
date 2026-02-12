import { ipcMain } from 'electron'
import * as gitService from '../services/git.service'

export function registerGitIpc(): void {
  ipcMain.handle('git:status', async (_e, repoPath: string) => {
    return gitService.getStatus(repoPath)
  })

  ipcMain.handle('git:diff', async (_e, repoPath: string) => {
    return gitService.getDiff(repoPath)
  })

  ipcMain.handle('git:diff-staged', async (_e, repoPath: string) => {
    return gitService.getDiffStaged(repoPath)
  })

  ipcMain.handle('git:diff-file', async (_e, repoPath: string, filePath: string) => {
    return gitService.getDiffFile(repoPath, filePath)
  })

  ipcMain.handle('git:full-diff', async (_e, repoPath: string) => {
    return gitService.getFullDiff(repoPath)
  })

  ipcMain.handle('git:stage', async (_e, repoPath: string, files: string[]) => {
    await gitService.stageFiles(repoPath, files)
  })

  ipcMain.handle('git:unstage', async (_e, repoPath: string, files: string[]) => {
    await gitService.unstageFiles(repoPath, files)
  })

  ipcMain.handle('git:stage-all', async (_e, repoPath: string) => {
    await gitService.stageAll(repoPath)
  })

  ipcMain.handle('git:commit', async (_e, repoPath: string, message: string) => {
    return gitService.commit(repoPath, message)
  })

  ipcMain.handle('git:branches', async (_e, repoPath: string) => {
    return gitService.getBranches(repoPath)
  })

  ipcMain.handle('git:checkout', async (_e, repoPath: string, branch: string) => {
    await gitService.checkout(repoPath, branch)
  })

  ipcMain.handle('git:create-branch', async (_e, repoPath: string, branch: string) => {
    await gitService.createBranch(repoPath, branch)
  })

  ipcMain.handle('git:log', async (_e, repoPath: string, maxCount?: number) => {
    return gitService.getLog(repoPath, maxCount)
  })

  ipcMain.handle('git:current-branch', async (_e, repoPath: string) => {
    return gitService.getCurrentBranch(repoPath)
  })

  ipcMain.handle('git:is-repo', async (_e, repoPath: string) => {
    return gitService.isGitRepo(repoPath)
  })

  ipcMain.handle('git:file-content', async (_e, repoPath: string, filePath: string, ref?: string) => {
    return gitService.getFileContent(repoPath, filePath, ref)
  })

  ipcMain.handle('git:pull', async (_e, repoPath: string) => {
    await gitService.pull(repoPath)
  })

  ipcMain.handle('git:push', async (_e, repoPath: string) => {
    await gitService.push(repoPath)
  })
}
