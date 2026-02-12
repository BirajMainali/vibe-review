const COMMIT_SYSTEM_PROMPT = `Generate a single-line conventional commit message (type(scope): description) for the given diff. Use feat, fix, docs, style, refactor, test, chore, or perf. Be concise. Output ONLY the commit message, no quotes or formatting.`

const REPHRASE_SYSTEM_PROMPT = `Rephrase the given code review comment to be clearer and more professional. Keep the same meaning and intent. The comment's severity type is provided for context — adapt the tone accordingly (e.g. a "bug" should sound more urgent, a "nitpick" should be gentle, a "suggestion" should be constructive, a "question" should be inquisitive). Output ONLY the rephrased text, no quotes or extra formatting.`

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

export async function rephraseComment(
  text: string,
  severity: string,
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
        { role: 'system', content: REPHRASE_SYSTEM_PROMPT },
        { role: 'user', content: `Severity: ${severity}\n\nRephrase this code review comment:\n\n${text}` }
      ],
      max_tokens: 300,
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

  let result = ''
  if (typeof content === 'string') {
    result = content
  } else if (Array.isArray(content) && content[0]) {
    const part = content[0]
    result = part?.text ?? part?.content ?? (typeof part === 'string' ? part : '')
  } else if (typeof first?.text === 'string') {
    result = first.text
  }

  return String(result || '').trim() || text
}
