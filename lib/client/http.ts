const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const

export { JSON_HEADERS }

export async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = await readJsonSafely<{ error?: string; message?: string }>(response)

  return payload?.error || payload?.message || fallback
}

export async function postJson<TResponse, TBody>(
  input: RequestInfo | URL,
  body: TBody,
  init?: Omit<RequestInit, 'body' | 'method' | 'headers'> & {
    headers?: HeadersInit
  },
): Promise<TResponse> {
  const response = await fetch(input, {
    ...init,
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'リクエストに失敗しました'))
  }

  const payload = await readJsonSafely<TResponse>(response)

  if (!payload) {
    throw new Error('レスポンスの解析に失敗しました')
  }

  return payload
}
