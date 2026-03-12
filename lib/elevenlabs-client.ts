export interface VoiceoverOptions {
  text: string
  voiceId: string
  modelId?: string
}

export interface SoundEffectOptions {
  prompt: string
  durationSeconds?: number
}

export interface Voice {
  voiceId: string
  name: string
}

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set')
  return key
}

export async function generateVoiceover(
  options: VoiceoverOptions,
): Promise<ArrayBuffer> {
  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${options.voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': getApiKey(),
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.modelId ?? 'eleven_multilingual_v2',
      }),
    },
  )

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS error: ${res.status} ${res.statusText}`)
  }

  return res.arrayBuffer()
}

export async function generateSoundEffect(
  options: SoundEffectOptions,
): Promise<ArrayBuffer> {
  const res = await fetch(`${ELEVENLABS_BASE}/sound-generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': getApiKey(),
    },
    body: JSON.stringify({
      text: options.prompt,
      duration_seconds: options.durationSeconds,
    }),
  })

  if (!res.ok) {
    throw new Error(
      `ElevenLabs sound generation error: ${res.status} ${res.statusText}`,
    )
  }

  return res.arrayBuffer()
}

export async function listVoices(): Promise<Voice[]> {
  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: {
      'xi-api-key': getApiKey(),
    },
  })

  if (!res.ok) {
    throw new Error(`ElevenLabs voices error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return (data.voices ?? []).map(
    (v: { voice_id: string; name: string }) => ({
      voiceId: v.voice_id,
      name: v.name,
    }),
  )
}
