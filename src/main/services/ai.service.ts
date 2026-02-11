const COMMIT_SYSTEM_PROMPT = `Generate a single-line conventional commit message (type(scope): description) for the given diff. Use feat, fix, docs, style, refactor, test, chore, or perf. Be concise. Output ONLY the commit message, no quotes or formatting.`

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
    const errText = await response.text()
    let message = `AI request failed: ${response.status}`
    try {
      const errJson = JSON.parse(errText)
      const apiMsg = errJson?.error?.message || errJson?.message
      if (apiMsg) message = apiMsg
    } catch {
      if (errText) message += ` ${errText}`
    }
    throw new Error(message)
  }

  const data = (await response.json()) as Record<string, unknown>
  const choices = ((data.data ?? data) as any)?.choices
  const first = choices?.[0]
  const msg = first?.message ?? first?.delta ?? first
  const content = msg?.content

  let text = ''
  if (typeof content === 'string') {
    text = content
  } else if (Array.isArray(content) && content[0]) {
    const part = content[0]
    text = part?.text ?? part?.content ?? (typeof part === 'string' ? part : '')
  } else if (typeof first?.text === 'string') {
    text = first.text
  }

  const result = String(text || '').trim()
  if (!result) {
    throw new Error('AI returned empty content. Try a different model.')
  }

  return result.split('\n')[0].trim()
}
