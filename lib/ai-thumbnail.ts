/**
 * サムネイルAI生成コア
 * OpenRouter + Gemini 3.1 Flash Image Preview で YouTube サムネイルを生成
 */

import fs from 'fs/promises'
import path from 'path'
import { getTemplateById } from './thumbnail-templates'

// ============================================
// 型定義
// ============================================

export type ThumbnailMode = 'TEMPLATE' | 'UPLOAD' | 'VIDEO_FRAME' | 'REFERENCE'

export interface ThumbnailGenerateRequest {
  projectId: string
  mode: ThumbnailMode

  // 共通
  prompt: string // サムネに入れたいテキスト（動画タイトルなど）

  // テンプレートモード
  templateId?: string

  // 素材アップロードモード
  uploadedImages?: string[] // base64画像の配列

  // 動画フレームモード
  frameTimestamps?: number[] // 使いたいフレームの秒数

  // 参考YouTuberモード
  referenceUrl?: string // YouTube URL
  referenceImages?: string[] // 参考サムネイル画像(base64)

  // オプション
  options?: {
    aspectRatio?: '16:9' | '4:3'
    textPosition?: 'left' | 'center' | 'right'
    colorScheme?: string // "warm" | "cool" | "vibrant" | "dark"
    count?: number // 生成枚数 (1-4, デフォルト2)
  }
}

export interface GeneratedThumbnail {
  id: string
  imageUrl: string
  imagePath: string
  base64: string
  width: number
  height: number
}

// ============================================
// モデル設定
// ============================================

const THUMBNAIL_MODEL = 'google/gemini-3.1-flash-image-preview'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ============================================
// システムプロンプト
// ============================================

const SYSTEM_PROMPT = `You are a professional YouTube thumbnail designer.
Create a 1280x720 thumbnail image.

Rules:
1. テキストは大きく読みやすく配置
2. 日本語テキストを正確にレンダリング
3. YouTubeサムネイルとして目を引くデザイン
4. 人物がある場合は顔を大きく
5. 背景はシンプルすぎずうるさすぎず
6. コントラストを高くして視認性確保
7. テキストにはアウトライン（縁取り）をつけて背景との区別を明確に
8. 出力は必ず1枚の画像のみ`

// ============================================
// プロンプト構築
// ============================================

function buildUserPrompt(request: ThumbnailGenerateRequest): string {
  const parts: string[] = []

  switch (request.mode) {
    case 'TEMPLATE': {
      const template = request.templateId
        ? getTemplateById(request.templateId)
        : null
      if (template) {
        parts.push(`テンプレート: ${template.name}`)
        parts.push(`スタイル指示: ${template.promptHint}`)
      }
      break
    }
    case 'UPLOAD':
      parts.push(
        'アップロードされた素材画像を参照し、サムネイル向けにリミックスしてください。'
      )
      parts.push(
        '素材の主要な要素（人物・オブジェクト）を活かしつつ、YouTube向けに最適化します。'
      )
      break
    case 'VIDEO_FRAME':
      parts.push(
        '動画フレームの人物・背景を活かしてYouTubeサムネイルを作成してください。'
      )
      parts.push(
        'フレーム内の人物の表情やポーズを強調し、背景にエフェクトを追加します。'
      )
      break
    case 'REFERENCE':
      parts.push(
        '参考画像のスタイルを模倣してサムネイルを作成してください。'
      )
      parts.push('参考画像の構図・色味・テキスト配置を分析して再現します。')
      break
  }

  parts.push(`\nタイトルテキスト: 「${request.prompt}」`)

  // オプション
  if (request.options) {
    const { textPosition, colorScheme, aspectRatio } = request.options
    if (colorScheme) parts.push(`色味: ${colorScheme}`)
    if (textPosition) parts.push(`テキスト位置: ${textPosition}`)
    if (aspectRatio && aspectRatio !== '16:9')
      parts.push(`アスペクト比: ${aspectRatio}`)
  }

  return parts.join('\n')
}

// ============================================
// 入力画像のメッセージコンテンツ構築
// ============================================

interface ContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

function buildMessageContent(
  request: ThumbnailGenerateRequest
): ContentPart[] {
  const content: ContentPart[] = []

  // テキストプロンプト
  content.push({ type: 'text', text: buildUserPrompt(request) })

  // 入力画像の追加
  const images = collectInputImages(request)
  for (const base64 of images) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64}` },
    })
  }

  return content
}

function collectInputImages(request: ThumbnailGenerateRequest): string[] {
  switch (request.mode) {
    case 'UPLOAD':
      return request.uploadedImages ?? []
    case 'REFERENCE':
      return request.referenceImages ?? []
    default:
      return []
  }
}

// ============================================
// OpenRouter API 呼び出し
// ============================================

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content:
        | string
        | Array<{
            type: string
            text?: string
            image_url?: { url: string }
          }>
    }
  }>
  error?: { message: string; code?: string }
}

async function callOpenRouterImageGeneration(
  content: ContentPart[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY が設定されていません')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://sakuedit.com',
      'X-Title': 'SakuEdit Thumbnail Generator',
    },
    body: JSON.stringify({
      model: THUMBNAIL_MODEL,
      modalities: ['image', 'text'],
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `OpenRouter APIエラー (${response.status}): ${errorBody}`
    )
  }

  const data = (await response.json()) as OpenRouterResponse

  if (data.error) {
    throw new Error(`OpenRouter APIエラー: ${data.error.message}`)
  }

  // レスポンスから base64 画像を抽出
  return extractBase64FromResponse(data)
}

function extractBase64FromResponse(data: OpenRouterResponse): string {
  const messageContent = data.choices?.[0]?.message?.content
  if (!messageContent) {
    throw new Error('OpenRouter APIからレスポンスが返されませんでした')
  }

  // content が配列の場合（multimodal response）
  if (Array.isArray(messageContent)) {
    for (const part of messageContent) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return extractBase64FromDataUrl(part.image_url.url)
      }
    }
    throw new Error('レスポンスに画像が含まれていません')
  }

  // content が文字列の場合（data URL が含まれる）
  if (typeof messageContent === 'string') {
    const dataUrlMatch = messageContent.match(
      /data:image\/[a-zA-Z]+;base64,([A-Za-z0-9+/=]+)/
    )
    if (dataUrlMatch?.[1]) {
      return dataUrlMatch[1]
    }
    // 文字列全体が base64 の場合
    if (/^[A-Za-z0-9+/=]+$/.test(messageContent) && messageContent.length > 100) {
      return messageContent
    }
    throw new Error('レスポンスから画像データを抽出できませんでした')
  }

  throw new Error('予期しないレスポンス形式です')
}

function extractBase64FromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/)
  if (match?.[1]) {
    return match[1]
  }
  // data URL でない場合はそのまま返す
  return dataUrl
}

// ============================================
// 画像保存
// ============================================

async function saveThumbnailImage(
  base64: string,
  projectId: string,
  thumbnailId: string
): Promise<string> {
  const dir = path.join(
    process.cwd(),
    'uploads',
    'projects',
    projectId,
    'thumbnails'
  )
  await fs.mkdir(dir, { recursive: true })

  const filePath = path.join(dir, `${thumbnailId}.png`)
  const buffer = Buffer.from(base64, 'base64')
  await fs.writeFile(filePath, buffer)

  return filePath
}

// ============================================
// メインエクスポート: サムネイル生成
// ============================================

export async function generateThumbnailImage(
  request: ThumbnailGenerateRequest,
  thumbnailId: string
): Promise<{ base64: string; imagePath: string }> {
  const content = buildMessageContent(request)
  const base64 = await callOpenRouterImageGeneration(content)

  const imagePath = await saveThumbnailImage(
    base64,
    request.projectId,
    thumbnailId
  )

  return { base64, imagePath }
}

/**
 * 複数枚同時生成（並列実行）
 */
export async function generateMultipleThumbnails(
  request: ThumbnailGenerateRequest,
  thumbnailIds: string[]
): Promise<
  Array<{ id: string; base64: string; imagePath: string } | { id: string; error: string }>
> {
  const results = await Promise.allSettled(
    thumbnailIds.map(async (id) => {
      const result = await generateThumbnailImage(request, id)
      return { id, ...result }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      id: thumbnailIds[index],
      error:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    }
  })
}
