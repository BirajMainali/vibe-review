import { ipcMain } from 'electron'
import * as gitService from '../services/git.service'
import * as aiService from '../services/ai.service'
import * as dbService from '../services/db.service'

export function registerAiIpc(): void {
  ipcMain.handle('ai:generate-commit-message', async (_e, repoPath: string) => {
    const baseUrl = dbService.getSetting('openai_base_url') || ''
    const apiKey = dbService.getSetting('openai_api_key') || ''

    if (!baseUrl || !apiKey) {
      throw new Error('Configure OpenAI Base URL and API Key in Settings first')
    }

    const model = dbService.getSetting('openai_model') || ''

    const diff = await gitService.getDiffStaged(repoPath)
    if (!diff || !diff.trim()) {
      throw new Error('No staged changes to generate commit message for')
    }

    // Limit diff size to avoid token limits (roughly ~8k chars = ~2k tokens)
    const truncatedDiff = diff.length > 6000 ? diff.slice(0, 6000) + '\n\n... (truncated)' : diff

    return aiService.generateCommitMessage(truncatedDiff, baseUrl, apiKey, model)
  })

  ipcMain.handle('ai:rephrase-comment', async (_e, text: string) => {
    const baseUrl = dbService.getSetting('openai_base_url') || ''
    const apiKey = dbService.getSetting('openai_api_key') || ''

    if (!baseUrl || !apiKey) {
      throw new Error('Configure OpenAI Base URL and API Key in Settings first')
    }

    const model = dbService.getSetting('openai_model') || ''

    if (!text?.trim()) {
      throw new Error('Enter some text to rephrase')
    }

    return aiService.rephraseComment(text.trim(), baseUrl, apiKey, model)
  })
}
