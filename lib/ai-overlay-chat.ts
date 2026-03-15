/**
 * AI Overlay Chat Engine
 * 自然言語の指示をRVE Overlay操作に変換するAIチャットエンジン
 * RVEのoverlay JSON形式を直接操作する
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { Overlay, CaptionOverlay, ClipOverlay, TextOverlay, SoundOverlay } from '@/app/reactvideoeditor/pro/types'
import { OverlayType } from '@/app/reactvideoeditor/pro/types'

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

const CHAT_MODEL = 'google/gemini-3-flash-preview'

// ============================================
// Types
// ============================================

export interface OverlayOperation {
  op: 'add' | 'update' | 'delete' | 'update_style'
  overlayId?: number
  overlayType?: string
  fields?: Record<string, unknown>
}

export interface OverlayChatResult {
  operations: OverlayOperation[]
  message: string
}

// ============================================
// Zod Schema for AI output
// ============================================

const OverlayOpSchema = z.object({
  operations: z.array(z.object({
    op: z.enum(['add', 'update', 'delete', 'update_style']),
    overlayId: z.number().optional(),
    overlayType: z.enum(['text', 'image', 'video', 'sound', 'caption', 'shape', 'sticker']).optional(),
    fields: z.record(z.string(), z.unknown()).optional(),
  })),
  message: z.string(),
})

// ============================================
// System Prompt
// ============================================

const OVERLAY_SYSTEM_PROMPT = `あなたはSakuEditの動画編集AIアシスタントです。
ユーザーの自然言語の編集指示を、RVE Overlay操作に変換してください。

## Overlay操作の種類
- add: 新しいoverlayを追加。overlayType と fields が必要
- update: 既存overlayのフィールドを更新。overlayId と fields が必要
- delete: overlayを削除。overlayId が必要
- update_style: overlayのスタイルを更新。overlayId と fields.styles が必要

## Overlay種類
- text: テキスト（content, styles.fontSize, styles.color, styles.fontFamily等）
- caption: 字幕（captions配列, styles.fontSize, styles.color等, template）
- video: 動画（src, segments, speed, styles.volume等）
- sound: 音声（src, styles.volume, styles.fadeIn, styles.fadeOut等）
- image: 画像（src, styles.objectFit等）
- shape: 図形（content, styles.fill等）

## Overlayの主要フィールド
- from: 開始フレーム (fps=30)
- durationInFrames: 長さ（フレーム数）
- left, top: 位置（ピクセル）
- width, height: サイズ（ピクセル）
- row: タイムラインの行番号
- rotation: 回転角度

## フレーム変換（fps=30）
- 1秒 = 30フレーム
- 「3秒から」→ from: 90
- 「5秒間表示」→ durationInFrames: 150

## キャプション（字幕）のフィールド
- captions: [{text, startMs, endMs, timestampMs, confidence, words}]
- styles: {fontFamily, fontSize, color, backgroundColor, fontWeight, textShadow, textAlign}
- template: "classic" | "minimal" | "hustle" | "neon" | "retro"

## 動画のフィールド
- segments: [{startFrame, endFrame}] - 無音カット等に使用
- speed: 再生速度
- styles.volume: 音量 (0-1)

## 重要なルール
1. add の場合、overlayId は不要（自動生成）
2. update/delete の場合、overlayId を正確に指定
3. message には日本語で操作の説明を書く
4. 編集指示でない場合は operations を空にして message で応答
5. 字幕のスタイル変更は template フィールドで制御可能
6. テキストのデフォルト位置は画面中央（left,topは自動計算）`

// ============================================
// Overlay summary for AI context
// ============================================

function summarizeOverlays(overlays: Overlay[], fps: number): string {
  const lines: string[] = []
  lines.push(`## 現在のタイムライン (fps=${fps})`)

  if (overlays.length === 0) {
    lines.push('（空のタイムライン）')
    return lines.join('\n')
  }

  for (const overlay of overlays) {
    const startSec = (overlay.from / fps).toFixed(1)
    const durSec = (overlay.durationInFrames / fps).toFixed(1)
    const pos = `pos=(${overlay.left},${overlay.top}) size=${overlay.width}x${overlay.height}`

    switch (overlay.type) {
      case OverlayType.VIDEO: {
        const v = overlay as ClipOverlay
        const segs = v.segments?.length ?? 0
        const speed = v.speed ?? 1
        const vol = v.styles?.volume ?? 1
        lines.push(`- [id=${v.id}] VIDEO ${startSec}s~${durSec}s ${pos} speed=${speed} vol=${vol} segments=${segs}`)
        break
      }
      case OverlayType.CAPTION: {
        const c = overlay as CaptionOverlay
        const captionCount = c.captions?.length ?? 0
        const firstText = c.captions?.[0]?.text?.slice(0, 20) ?? ''
        lines.push(`- [id=${c.id}] CAPTION ${startSec}s~${durSec}s template="${c.template ?? 'classic'}" ${captionCount}件 "${firstText}..."`)
        break
      }
      case OverlayType.TEXT: {
        const t = overlay as TextOverlay
        lines.push(`- [id=${t.id}] TEXT ${startSec}s~${durSec}s "${t.content?.slice(0, 20)}" ${pos}`)
        break
      }
      case OverlayType.SOUND: {
        const s = overlay as SoundOverlay
        const vol = s.styles?.volume ?? 1
        lines.push(`- [id=${s.id}] SOUND ${startSec}s~${durSec}s vol=${vol}`)
        break
      }
      default: {
        lines.push(`- [id=${overlay.id}] ${overlay.type} ${startSec}s~${durSec}s ${pos}`)
        break
      }
    }
  }

  return lines.join('\n')
}

// ============================================
// Main function
// ============================================

export async function generateOverlayOperations(input: {
  userMessage: string
  overlays: Overlay[]
  fps?: number
  aspectRatio?: string
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<OverlayChatResult> {
  const fps = input.fps ?? 30
  const overlaySummary = summarizeOverlays(input.overlays, fps)

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: OVERLAY_SYSTEM_PROMPT },
    { role: 'system', content: `${overlaySummary}\n\nアスペクト比: ${input.aspectRatio ?? '16:9'}` },
  ]

  const recentHistory = (input.chatHistory ?? []).slice(-10)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: input.userMessage })

  try {
    const { object } = await generateObject({
      model: openrouter(CHAT_MODEL),
      schema: OverlayOpSchema,
      messages,
      temperature: 0.3,
    })

    return {
      operations: object.operations,
      message: object.message,
    }
  } catch (error) {
    console.error('AI overlay chat error:', error)
    return {
      operations: [],
      message: 'すみません、処理中にエラーが発生しました。もう一度お試しください。',
    }
  }
}
