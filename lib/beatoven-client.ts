export interface BeatovenComposeOptions {
  prompt: string
  format?: 'mp3' | 'aac' | 'wav'
  looping?: boolean
}

export interface BeatovenTaskResult {
  taskId: string
  status: 'started' | 'composing' | 'running' | 'composed' | 'failed'
  trackUrl?: string
  stemsUrl?: string
}

const BEATOVEN_BASE = 'https://api.beatoven.ai/api/v1'

function getApiKey(): string {
  const key = process.env.BEATOVEN_API_KEY
  if (!key) throw new Error('BEATOVEN_API_KEY is not set')
  return key
}

export async function composeBGM(
  options: BeatovenComposeOptions,
): Promise<{ taskId: string }> {
  const res = await fetch(`${BEATOVEN_BASE}/tracks/compose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      prompt: { text: options.prompt },
      format: options.format ?? 'mp3',
      looping: options.looping ?? false,
    }),
  })

  if (!res.ok) {
    throw new Error(`Beatoven API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return { taskId: data.task_id }
}

export async function getTaskStatus(
  taskId: string,
): Promise<BeatovenTaskResult> {
  const res = await fetch(`${BEATOVEN_BASE}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Beatoven API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return {
    taskId: data.task_id ?? taskId,
    status: data.status,
    trackUrl: data.meta?.track_url,
    stemsUrl: data.meta?.stems_url,
  }
}

export async function pollUntilComposed(
  taskId: string,
  maxAttempts = 60,
): Promise<BeatovenTaskResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskStatus(taskId)
    if (result.status === 'composed' || result.status === 'failed') {
      return result
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`Beatoven task ${taskId} timed out after ${maxAttempts} attempts`)
}
