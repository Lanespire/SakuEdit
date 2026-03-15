/**
 * Deepgram ASR Adapter
 * 課金ユーザー向け高精度文字起こし
 */

import fs from 'fs/promises'

export interface DeepgramSegment {
  start: number
  end: number
  text: string
  confidence: number
}

export interface DeepgramResult {
  text: string
  segments: DeepgramSegment[]
}

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen'

function getDeepgramApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) {
    throw new Error('DEEPGRAM_API_KEY is not configured')
  }
  return key
}

export function isDeepgramConfigured(): boolean {
  return Boolean(process.env.DEEPGRAM_API_KEY)
}

export async function transcribeWithDeepgram(
  audioPath: string,
  language: string = 'ja',
): Promise<DeepgramResult> {
  const apiKey = getDeepgramApiKey()
  const audioBuffer = await fs.readFile(audioPath)

  const params = new URLSearchParams({
    model: 'nova-3',
    language,
    smart_format: 'true',
    punctuate: 'true',
    utterances: 'true',
    diarize: 'false',
  })

  const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBuffer,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Deepgram API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  const channel = data.results?.channels?.[0]
  const alternative = channel?.alternatives?.[0]

  if (!alternative) {
    return { text: '', segments: [] }
  }

  const fullText: string = alternative.transcript ?? ''

  // Extract word-level segments, grouped into utterances
  const utterances: DeepgramSegment[] = (data.results?.utterances ?? []).map(
    (u: { start: number; end: number; transcript: string; confidence: number }) => ({
      start: u.start,
      end: u.end,
      text: u.transcript,
      confidence: u.confidence,
    }),
  )

  // If no utterances, fall back to word-level grouping
  if (utterances.length === 0 && alternative.words?.length > 0) {
    const words = alternative.words as Array<{
      word: string
      start: number
      end: number
      confidence: number
    }>

    // Group words into ~3 second segments
    const grouped: DeepgramSegment[] = []
    let current: { words: string[]; start: number; end: number; confidence: number[] } | null = null

    for (const word of words) {
      if (!current || word.start - current.end > 1.0 || word.end - current.start > 3.0) {
        if (current) {
          grouped.push({
            start: current.start,
            end: current.end,
            text: current.words.join(''),
            confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
          })
        }
        current = { words: [word.word], start: word.start, end: word.end, confidence: [word.confidence] }
      } else {
        current.words.push(word.word)
        current.end = word.end
        current.confidence.push(word.confidence)
      }
    }

    if (current) {
      grouped.push({
        start: current.start,
        end: current.end,
        text: current.words.join(''),
        confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
      })
    }

    return { text: fullText, segments: grouped }
  }

  return { text: fullText, segments: utterances }
}
