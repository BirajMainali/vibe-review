import { ipcMain } from 'electron'
import * as dbService from '../services/db.service'

export function registerDbIpc(): void {
  // --- Projects ---
  ipcMain.handle('db:projects:all', async () => {
    return dbService.getAllProjects()
  })

  ipcMain.handle('db:projects:get', async (_e, id: number) => {
    return dbService.getProjectById(id)
  })

  ipcMain.handle('db:projects:add', async (_e, name: string, path: string) => {
    return dbService.addProject(name, path)
  })

  ipcMain.handle('db:projects:remove', async (_e, id: number) => {
    dbService.removeProject(id)
  })

  ipcMain.handle('db:projects:touch', async (_e, id: number) => {
    dbService.touchProject(id)
  })

  // --- Settings ---
  ipcMain.handle('db:settings:get', async (_e, key: string) => {
    return dbService.getSetting(key)
  })

  ipcMain.handle('db:settings:set', async (_e, key: string, value: string) => {
    dbService.setSetting(key, value)
  })

  ipcMain.handle('db:settings:all', async () => {
    return dbService.getAllSettings()
  })
}
