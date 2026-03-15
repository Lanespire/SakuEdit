/**
 * AI Text Correction
 * 文字起こし結果の文脈補正（不自然な箇所・誤認識の修正）
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

const DEFAULT_MODEL = 'google/gemini-3.1-flash-lite-preview'
const PREMIUM_MODEL = 'google/gemini-3-flash-preview'

export interface CorrectedSegment {
  start: number
  end: number
  text: string
  original: string
  corrected: boolean
}

const CorrectionSchema = z.object({
  segments: z.array(z.object({
    index: z.number(),
    correctedText: z.string(),
    wasChanged: z.boolean(),
  })),
})

/**
 * AI文脈補正: 文字起こし結果を文脈に基づいて修正
 * - 同音異義語の修正
 * - フィラー（えー、あー）の除去
 * - 文法的に不自然な箇所の補正
 * - 固有名詞の推測修正
 */
export async function correctTranscription(
  segments: Array<{ start: number; end: number; text: string }>,
  isPremium: boolean = false,
): Promise<CorrectedSegment[]> {
  if (segments.length === 0) {
    return []
  }

  const model = isPremium ? PREMIUM_MODEL : DEFAULT_MODEL

  // Process in batches of 30 segments to stay within token limits
  const batchSize = 30
  const correctedSegments: CorrectedSegment[] = []

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize)
    const batchText = batch
      .map((s, idx) => `[${i + idx}] (${s.start.toFixed(1)}s-${s.end.toFixed(1)}s) "${s.text}"`)
      .join('\n')

    try {
      const { object } = await generateObject({
        model: openrouter(model),
        schema: CorrectionSchema,
        messages: [
          {
            role: 'system',
            content: `あなたは日本語の音声認識結果を補正する専門家です。
以下の文字起こしセグメントを確認し、不自然な箇所を修正してください。

## 修正ルール
1. 同音異義語の修正（文脈に合った漢字・表記に）
2. フィラー（「えー」「あー」「うーん」「あのー」）は除去
3. 言い直し・繰り返しの整理
4. 明らかな誤認識の修正
5. 自然な文にならない場合のみ修正（正しいものは変えない）
6. 文の意味を変えない
7. 空になるセグメント（フィラーのみ）は空文字列にする

修正が不要なセグメントは wasChanged: false にしてください。`,
          },
          {
            role: 'user',
            content: `以下の文字起こしセグメントを補正してください:\n\n${batchText}`,
          },
        ],
        temperature: 0.2,
      })

      for (const correction of object.segments) {
        const originalIdx = correction.index
        if (originalIdx < 0 || originalIdx >= segments.length) continue
        const original = segments[originalIdx]
        correctedSegments.push({
          start: original.start,
          end: original.end,
          text: correction.wasChanged ? correction.correctedText : original.text,
          original: original.text,
          corrected: correction.wasChanged,
        })
      }

      // Add any segments not returned by the AI (shouldn't happen, but safety)
      for (let j = 0; j < batch.length; j++) {
        const globalIdx = i + j
        if (!correctedSegments.some((s) => s.start === segments[globalIdx].start && s.end === segments[globalIdx].end)) {
          correctedSegments.push({
            ...segments[globalIdx],
            original: segments[globalIdx].text,
            corrected: false,
          })
        }
      }
    } catch (error) {
      console.error(`AI correction batch ${i} failed:`, error)
      // On error, pass through original segments
      for (const segment of batch) {
        correctedSegments.push({
          ...segment,
          original: segment.text,
          corrected: false,
        })
      }
    }
  }

  // Filter out empty segments (removed fillers)
  return correctedSegments
    .filter((s) => s.text.trim().length > 0)
    .sort((a, b) => a.start - b.start)
}
