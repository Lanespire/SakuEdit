/**
 * AI Composition Chat Engine
 * 自然言語の指示をCompositionPatch[]に変換するAIチャットエンジン
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { CompositionData, CompositionPatch, TrackName } from './composition-data'
import { generateItemId } from './composition-data'

// ============================================
// OpenRouter Configuration (lib/ai.tsと同じパターン)
// ============================================
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

const MODELS = {
  geminiFlashLite: 'google/gemini-3.1-flash-lite-preview',
  geminiFlash: 'google/gemini-3-flash-preview',
  geminiPro: 'google/gemini-3.1-pro-preview',
} as const

const CHAT_MODEL = MODELS.geminiFlash

// ============================================
// Types
// ============================================
export interface AIChatContext {
  userMessage: string
  currentData: CompositionData
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AIChatResult {
  patches: CompositionPatch[]
  message: string
  needsAssetSearch?: { type: 'se' | 'bgm'; query: string }
}

// ============================================
// Zod Schema for structured output
// ============================================
const PatchResponseSchema = z.object({
  patches: z.array(z.object({
    op: z.enum(['add_item', 'remove_item', 'update_item', 'update_meta', 'reorder_items', 'duplicate_item']),
    track: z.enum(['videoTrack', 'audioTracks', 'subtitleTrack', 'effectTrack', 'overlayTrack', 'captionTrack']).optional(),
    itemId: z.string().optional(),
    newId: z.string().optional(),
    item: z.record(z.string(), z.unknown()).optional(),
    fields: z.record(z.string(), z.unknown()).optional(),
    index: z.number().optional(),
    itemIds: z.array(z.string()).optional(),
  })),
  message: z.string(),
  needsAssetSearch: z.object({
    type: z.enum(['se', 'bgm']),
    query: z.string(),
  }).nullable().optional(),
})

type RawPatch = z.infer<typeof PatchResponseSchema>['patches'][number]

// ============================================
// Built-in SFX types
// ============================================
const BUILTIN_SFX_TYPES = [
  'whoosh', 'whip', 'pageTurn', 'uiSwitch', 'mouseClick',
  'shutterModern', 'shutterOld', 'ding', 'bruh', 'vineBoom', 'windowsXpError',
] as const

const SFX_ALIASES: Record<string, string> = {
  'シュッ': 'whoosh',
  'ビュッ': 'whip',
  'ページめくり': 'pageTurn',
  'スイッチ': 'uiSwitch',
  'クリック': 'mouseClick',
  'シャッター': 'shutterModern',
  'チーン': 'ding',
  'ドーン': 'vineBoom',
  'エラー': 'windowsXpError',
}

// ============================================
// System Prompt
// ============================================
const SYSTEM_PROMPT = `あなたはSakuEditの動画編集AIアシスタントです。
ユーザーの自然言語による編集指示を、CompositionPatchの配列に変換してください。

## CompositionPatchの種類
- add_item: トラックにアイテムを追加（track, item が必要）
- remove_item: アイテムを削除（track, itemId が必要）
- update_item: アイテムのフィールドを更新（track, itemId, fields が必要）
- update_meta: メタ情報を更新（fields が必要）
- reorder_items: トラック内のアイテム順序を変更（track, itemIds が必要）
- duplicate_item: アイテムを複製（track, itemId, newId が必要）

## トラック名
- videoTrack: 動画トラック
- audioTracks: 音声トラック（BGM, SE, ナレーション）
- subtitleTrack: 字幕トラック
- effectTrack: エフェクトトラック
- overlayTrack: オーバーレイトラック（テキスト、画像、図形など）
- captionTrack: キャプショントラック（TikTokスタイル）

## 音声アイテムのカテゴリ
- bgm: バックグラウンドミュージック
- se: 効果音
- voiceover: ナレーション
- sfx-builtin: ビルトイン効果音

## ビルトインSE（sfxType）
whoosh(シュッ), whip(ビュッ), pageTurn(ページめくり), uiSwitch(スイッチ音), mouseClick(クリック音),
shutterModern(モダンシャッター), shutterOld(古いシャッター), ding(チーン), bruh(ブルー),
vineBoom(ドーン), windowsXpError(エラー音)

## エフェクトの種類
particle, light-leak, camera-motion-blur, trail,
transition-fade, transition-slide, transition-wipe, transition-flip, transition-clock-wipe,
noise-gradient, audio-visualizer, path-animation

## オーバーレイの種類
text, image, lottie, gif, rive, shape, rounded-text-box, chart, 3d-scene, skia-canvas, map

## 図形の種類（overlayType=shapeの場合）
rect, circle, triangle, star, ellipse, pie, arrow, heart, polygon

## 字幕アニメーション
fade, spring, typewriter, word-highlight, none

## 時刻変換ルール
- 「3分」→ 180秒
- 「1:30」→ 90秒
- 「30秒」→ 30秒
- 「1分半」→ 90秒

## 重要なルール
1. add_itemの場合、itemにはidフィールドを含めないでください（システムが自動付与します）
2. 必ずpatchesとmessageを返してください
3. messageにはユーザーへの返答（何を変更したかの説明）を日本語で書いてください
4. 既存のアイテムを参照する場合はitemIdを正確に指定してください
5. ビルトインSEを追加する場合、category: "sfx-builtin"とsfxTypeを設定してください
6. BGMやSEの検索が必要な場合、needsAssetSearchに検索クエリを設定してください
7. 指示が曖昧な場合は、最も一般的な解釈で実行し、messageで何を行ったか説明してください
8. 編集指示でない場合（挨拶、質問など）はpatchesを空にしてmessageで応答してください`

// ============================================
// Composition summary
// ============================================
function summarizeComposition(data: CompositionData): string {
  const lines: string[] = []

  lines.push(`## 動画メタ情報`)
  lines.push(`- 解像度: ${data.meta.width}x${data.meta.height}`)
  lines.push(`- FPS: ${data.meta.fps}`)
  lines.push(`- 長さ: ${data.meta.durationSeconds}秒 (${Math.floor(data.meta.durationSeconds / 60)}分${Math.round(data.meta.durationSeconds % 60)}秒)`)
  lines.push(`- 背景色: ${data.meta.backgroundColor}`)

  if (data.videoTrack.length > 0) {
    lines.push(`\n## 動画トラック (${data.videoTrack.length}アイテム)`)
    for (const v of data.videoTrack) {
      lines.push(`- id="${v.id}" volume=${v.volume} rate=${v.playbackRate} segments=${v.playbackSegments.length}`)
    }
  }

  if (data.audioTracks.length > 0) {
    lines.push(`\n## 音声トラック (${data.audioTracks.length}アイテム)`)
    for (const a of data.audioTracks) {
      const sfx = a.sfxType ? ` sfx=${a.sfxType}` : ''
      lines.push(`- id="${a.id}" category=${a.category} start=${a.startTime}s volume=${a.volume}${sfx}`)
    }
  }

  if (data.subtitleTrack.length > 0) {
    lines.push(`\n## 字幕トラック (${data.subtitleTrack.length}アイテム)`)
    const shown = data.subtitleTrack.slice(0, 10)
    for (const s of shown) {
      lines.push(`- id="${s.id}" [${s.startTime.toFixed(1)}-${s.endTime.toFixed(1)}s] "${s.text.slice(0, 30)}"`)
    }
    if (data.subtitleTrack.length > 10) {
      lines.push(`  ...他${data.subtitleTrack.length - 10}件`)
    }
  }

  if (data.effectTrack.length > 0) {
    lines.push(`\n## エフェクトトラック (${data.effectTrack.length}アイテム)`)
    for (const e of data.effectTrack) {
      lines.push(`- id="${e.id}" type=${e.effectType} [${e.startTime.toFixed(1)}-${e.endTime.toFixed(1)}s]`)
    }
  }

  if (data.overlayTrack.length > 0) {
    lines.push(`\n## オーバーレイトラック (${data.overlayTrack.length}アイテム)`)
    for (const o of data.overlayTrack) {
      lines.push(`- id="${o.id}" type=${o.overlayType} [${o.startTime.toFixed(1)}-${o.endTime.toFixed(1)}s] pos=(${o.position.x},${o.position.y})`)
    }
  }

  if (data.captionTrack.length > 0) {
    lines.push(`\n## キャプショントラック (${data.captionTrack.length}アイテム)`)
    const shown = data.captionTrack.slice(0, 5)
    for (const c of shown) {
      lines.push(`- id="${c.id}" [${(c.startMs / 1000).toFixed(1)}-${(c.endMs / 1000).toFixed(1)}s] "${c.text.slice(0, 30)}"`)
    }
    if (data.captionTrack.length > 5) {
      lines.push(`  ...他${data.captionTrack.length - 5}件`)
    }
  }

  if (
    data.videoTrack.length === 0 &&
    data.audioTracks.length === 0 &&
    data.subtitleTrack.length === 0 &&
    data.effectTrack.length === 0 &&
    data.overlayTrack.length === 0 &&
    data.captionTrack.length === 0
  ) {
    lines.push('\n（トラックは全て空です）')
  }

  return lines.join('\n')
}

// ============================================
// Patch normalization
// ============================================
const VALID_TRACKS: TrackName[] = ['videoTrack', 'audioTracks', 'subtitleTrack', 'effectTrack', 'overlayTrack', 'captionTrack']

function inferTrack(rawPatch: RawPatch): TrackName | undefined {
  if (rawPatch.track && VALID_TRACKS.includes(rawPatch.track as TrackName)) {
    return rawPatch.track as TrackName
  }

  // Infer from item content
  if (rawPatch.item) {
    if ('sfxType' in rawPatch.item || rawPatch.item.category === 'bgm' || rawPatch.item.category === 'se' || rawPatch.item.category === 'sfx-builtin') {
      return 'audioTracks'
    }
    if ('effectType' in rawPatch.item) return 'effectTrack'
    if ('overlayType' in rawPatch.item) return 'overlayTrack'
    if ('tokens' in rawPatch.item || 'startMs' in rawPatch.item) return 'captionTrack'
    if ('sourceUrl' in rawPatch.item && 'playbackSegments' in rawPatch.item) return 'videoTrack'
    if ('text' in rawPatch.item && ('startTime' in rawPatch.item || 'endTime' in rawPatch.item)) return 'subtitleTrack'
  }

  return undefined
}

function normalizePatches(rawPatches: RawPatch[], data: CompositionData): CompositionPatch[] {
  const patches: CompositionPatch[] = []

  for (const raw of rawPatches) {
    switch (raw.op) {
      case 'add_item': {
        const track = inferTrack(raw)
        if (!track || !raw.item) continue
        const item = { ...raw.item, id: generateItemId() }
        patches.push({
          op: 'add_item',
          track,
          item,
          ...(raw.index != null ? { index: raw.index } : {}),
        })
        break
      }

      case 'remove_item': {
        const track = raw.track as TrackName | undefined
        if (!track || !raw.itemId) continue
        patches.push({ op: 'remove_item', track, itemId: raw.itemId })
        break
      }

      case 'update_item': {
        const track = raw.track as TrackName | undefined
        if (!track || !raw.itemId || !raw.fields) continue
        patches.push({
          op: 'update_item',
          track,
          itemId: raw.itemId,
          fields: raw.fields,
        })
        break
      }

      case 'update_meta': {
        if (!raw.fields) continue
        patches.push({ op: 'update_meta', fields: raw.fields as Partial<CompositionData['meta']> })
        break
      }

      case 'reorder_items': {
        const track = raw.track as TrackName | undefined
        if (!track || !raw.itemIds) continue
        patches.push({ op: 'reorder_items', track, itemIds: raw.itemIds })
        break
      }

      case 'duplicate_item': {
        const track = raw.track as TrackName | undefined
        if (!track || !raw.itemId) continue
        patches.push({
          op: 'duplicate_item',
          track,
          itemId: raw.itemId,
          newId: raw.newId || generateItemId(),
        })
        break
      }
    }
  }

  return patches
}

// ============================================
// Main function
// ============================================
export async function generateCompositionPatches(context: AIChatContext): Promise<AIChatResult> {
  const { userMessage, currentData, chatHistory } = context

  const compositionSummary = summarizeComposition(currentData)

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'system',
      content: `## 現在のコンポジション状態\n${compositionSummary}`,
    },
  ]

  // Add recent chat history (last 10 messages)
  const recentHistory = chatHistory.slice(-10)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  messages.push({ role: 'user', content: userMessage })

  try {
    const { object } = await generateObject({
      model: openrouter(CHAT_MODEL),
      schema: PatchResponseSchema,
      messages,
      temperature: 0.3,
    })

    const patches = normalizePatches(object.patches, currentData)

    return {
      patches,
      message: object.message,
      needsAssetSearch: object.needsAssetSearch ?? undefined,
    }
  } catch (error) {
    console.error('AI composition chat error:', error)
    return {
      patches: [],
      message: 'すみません、リクエストの処理中にエラーが発生しました。もう一度お試しください。',
    }
  }
}
