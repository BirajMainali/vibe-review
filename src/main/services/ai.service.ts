const COMMIT_SYSTEM_PROMPT = `You are a git commit message generator. Generate a single-line conventional commit message (Husky style) based on the staged diff.

Rules:
- Use format: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore, perf
- Keep it concise (max 72 chars for the first line)
- Use imperative mood ("add" not "added", "fix" not "fixed")
- Do not include quotes or extra formatting - output ONLY the commit message
- If multiple logical changes, pick the most significant type`

export async function generateCommitMessage(
  diff: string,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<string> {
  if (!baseUrl.trim() || !apiKey.trim()) {
    throw new Error('OpenAI Base URL and API Key must be configured in Settings')
  }

  const modelToUse = model.trim() || 'gpt-4o-mini'

  const url = baseUrl.replace(/\/$/, '') + '/chat/completions'
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: 'system', content: COMMIT_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a conventional commit message for this diff:\n\n${diff}` }
      ],
      max_tokens: 150,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI request failed: ${response.status} ${err}`)
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No commit message in AI response')
  }

  return content.split('\n')[0].trim()
}
