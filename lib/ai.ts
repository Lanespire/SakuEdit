/**
 * AI Client for SakuEdit
 * Uses OpenRouter + AI SDK with Gemini Flash for cost-effective processing
 * Deepgram Nova-3 for ASR (speech-to-text) with local whisper fallback
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, generateObject } from 'ai'
import { z } from 'zod'
import { createReadStream } from 'fs'
import { DeepgramClient } from '@deepgram/sdk'
import fs from 'fs/promises'
import type { VideoStyleSample } from './video-processor'

// ============================================
// OpenRouter + Gemini Flash Configuration
// ============================================
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

// Model configurations
const MODELS = {
  // Gemini 3.1 Flash Lite (cost-efficient, high-volume)
  geminiFlashLite: 'google/gemini-3.1-flash-lite-preview',
  // Gemini 3 Flash (fast, good quality)
  geminiFlash: 'google/gemini-3-flash-preview',
  // Gemini 3.1 Pro (frontier reasoning, 1M context)
  geminiPro: 'google/gemini-3.1-pro-preview',
} as const

// Default model for anonymous users (cost-efficient)
const DEFAULT_MODEL = MODELS.geminiFlashLite
// Model for logged-in/paid users
const PREMIUM_MODEL = MODELS.geminiFlash

function sanitizeApiKey(value?: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const normalized = trimmed.toLowerCase()
  if (
    normalized === 'deepgram_api_key' ||
    normalized === 'your_deepgram_api_key_here' ||
    normalized.includes('replace_me')
  ) {
    return undefined
  }

  return trimmed
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const DEEPGRAM_API_KEY = sanitizeApiKey(process.env.DEEPGRAM_API_KEY)
const DEEPGRAM_MODEL = process.env.DEEPGRAM_MODEL || 'nova-3'

const deepgram = DEEPGRAM_API_KEY
  ? new DeepgramClient({ apiKey: DEEPGRAM_API_KEY })
  : null

// ============================================
// Style Analysis Schema (Zod)
// ============================================
const VisualStyleSchema = z.object({
  subtitleStyle: z.object({
    presence: z.enum(['none', 'light', 'moderate', 'heavy']),
    placement: z.enum(['top', 'middle', 'bottom', 'mixed', 'unknown']),
    emphasis: z.enum(['minimal', 'clean', 'bold', 'varied']),
    outlineStyle: z.enum(['none', 'thin', 'thick', 'box', 'mixed', 'unknown']),
    textDensity: z.enum(['low', 'medium', 'high']),
    dominantColors: z.array(z.string()).max(5),
    notes: z.string(),
  }),
  cameraStyle: z.object({
    framing: z.enum(['close-up', 'medium', 'wide', 'mixed', 'unknown']),
    facialEmphasis: z.enum(['low', 'medium', 'high']),
    zoomStyle: z.enum(['rare', 'occasional', 'frequent', 'unknown']),
    motionIntensity: z.enum(['low', 'medium', 'high']),
  }),
  bRollStyle: z.object({
    usage: z.enum(['low', 'medium', 'high']),
    dominantTypes: z.array(z.string()).max(5),
    notes: z.string(),
  }),
  colorStyle: z.object({
    brightness: z.enum(['dark', 'balanced', 'bright']),
    saturation: z.enum(['muted', 'balanced', 'vivid']),
    temperature: z.enum(['cool', 'neutral', 'warm', 'mixed']),
    palette: z.array(z.string()).max(5),
  }),
  compositionStyle: z.object({
    layout: z.enum(['centered', 'off-center', 'mixed']),
    textCoverage: z.enum(['low', 'medium', 'high']),
    backgroundComplexity: z.enum(['simple', 'moderate', 'busy']),
    notes: z.string(),
  }),
  pacingStyle: z.object({
    inferredJumpCutFrequency: z.enum(['low', 'medium', 'high']),
    sceneCount: z.number(),
    cutsPerMinute: z.number(),
    averageShotLength: z.number(),
    notes: z.string(),
  }),
  creatorStyleSummary: z.string(),
})

const StyleSettingsSchema = z.object({
  cutSettings: z.object({
    minSilence: z.number().describe('Minimum silence duration to cut (seconds)'),
    aggressiveness: z.enum(['low', 'medium', 'high']),
    targetCutsPerMinute: z.number().describe('Target number of cuts per minute'),
  }),
  subtitleSettings: z.object({
    font: z.string(),
    size: z.number(),
    position: z.enum(['top', 'middle', 'bottom']),
    color: z.string(),
    backgroundColor: z.string().optional(),
  }),
  bgmSettings: z.object({
    genre: z.string(),
    volume: z.number().min(0).max(1),
    tempo: z.string(),
  }),
  tempoSettings: z.object({
    minClipDuration: z.number(),
    maxClipDuration: z.number(),
  }),
})

export type VisualStyleProfile = z.infer<typeof VisualStyleSchema>
export type StyleAnalysisResult = z.infer<typeof StyleSettingsSchema> & {
  visualProfile: VisualStyleProfile
}

function createFallbackVisualProfile(): VisualStyleProfile {
  return {
    subtitleStyle: {
      presence: 'none',
      placement: 'unknown',
      emphasis: 'clean',
      outlineStyle: 'unknown',
      textDensity: 'low',
      dominantColors: [],
      notes: 'Visual analysis unavailable',
    },
    cameraStyle: {
      framing: 'unknown',
      facialEmphasis: 'medium',
      zoomStyle: 'unknown',
      motionIntensity: 'medium',
    },
    bRollStyle: {
      usage: 'medium',
      dominantTypes: [],
      notes: 'Visual analysis unavailable',
    },
    colorStyle: {
      brightness: 'balanced',
      saturation: 'balanced',
      temperature: 'neutral',
      palette: [],
    },
    compositionStyle: {
      layout: 'mixed',
      textCoverage: 'low',
      backgroundComplexity: 'moderate',
      notes: 'Visual analysis unavailable',
    },
    pacingStyle: {
      inferredJumpCutFrequency: 'medium',
      sceneCount: 0,
      cutsPerMinute: 0,
      averageShotLength: 0,
      notes: 'Visual analysis unavailable',
    },
    creatorStyleSummary: 'Visual analysis unavailable',
  }
}

// ============================================
// ASR Types
// ============================================
interface WhisperSegment {
  start: number
  end: number
  text: string
}

interface LocalWhisperResponse {
  text?: string
  segments?: WhisperSegment[]
}

interface ASRResult {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
    speaker?: string
  }>
}

// ============================================
// Chat Completion (Simple)
// ============================================
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number
    maxTokens?: number
    isPremium?: boolean
  } = {}
): Promise<string> {
  const model = options.isPremium ? PREMIUM_MODEL : DEFAULT_MODEL

  const { text } = await generateText({
    model: openrouter(model),
    messages,
    temperature: options.temperature ?? 0.7,
    // Note: maxTokens may need provider-level configuration in AI SDK v6
  })

  return text
}

// ============================================
// Streaming Chat (for real-time UI)
// ============================================
export async function streamChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number
    maxTokens?: number
    isPremium?: boolean
  } = {}
) {
  const model = options.isPremium ? PREMIUM_MODEL : DEFAULT_MODEL

  return streamText({
    model: openrouter(model),
    messages,
    temperature: options.temperature ?? 0.7,
    // Note: maxTokens may need provider-level configuration in AI SDK v6
  })
}

// ============================================
// Style Analysis with Structured Output
// ============================================
export async function analyzeStyle(
  transcript: string,
  metadata?: {
    title?: string
    description?: string
    duration?: number
    channelName?: string
  },
  visualProfile?: VisualStyleProfile,
  isPremium: boolean = false
): Promise<StyleAnalysisResult> {
  const model = isPremium ? PREMIUM_MODEL : DEFAULT_MODEL
  const resolvedVisualProfile = visualProfile ?? createFallbackVisualProfile()

  const contextParts: string[] = []
  if (metadata?.title) contextParts.push(`Video Title: ${metadata.title}`)
  if (metadata?.channelName) contextParts.push(`Channel Name: ${metadata.channelName}`)
  if (metadata?.description) contextParts.push(`Video Description: ${metadata.description}`)
  if (metadata?.duration) contextParts.push(`Duration: ${metadata.duration} seconds`)
  contextParts.push(`Visual Profile: ${JSON.stringify(resolvedVisualProfile)}`)
  contextParts.push(`Transcript: ${transcript}`)

  const systemPrompt = `You are a video editing style analyst specializing in short-form content (YouTube Shorts, TikTok, Reels).

Analyze the video content and determine optimal editing style for creating engaging, fast-paced content.
Use transcript cues for topic and pacing, but use the visual profile as the primary source for subtitle appearance, framing, composition, and jump-cut intensity.

Analysis guidelines:
1. **Cut Settings**: Determine optimal silence detection and cut frequency
   - News/Educational: Moderate cuts (8-12/min), lower aggressiveness
   - Entertainment/Vlog: Fast cuts (15-20/min), high aggressiveness
   - Gaming/Tech: Very fast cuts (20-25/min), high aggressiveness

2. **Subtitle Settings**: Match Japanese YouTuber subtitle style
   - Most Japanese YouTubers: Large, bold, bottom-positioned white text

3. **BGM Settings**: Suggest music mood
   - Educational/Tech: "upbeat", "lo-fi"
   - Entertainment: "energetic", "pop"
   - Volume should be 0.2-0.4

4. **Tempo Settings**: Clip duration for optimal pacing
   - Fast-paced: 2-4 seconds
   - Moderate: 4-7 seconds`

  const { object } = await generateObject({
    model: openrouter(model),
    schema: StyleSettingsSchema,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this video:\n\n${contextParts.join('\n\n')}` },
    ],
    temperature: 0.5,
  })

  return {
    ...object,
    visualProfile: resolvedVisualProfile,
  }
}

export async function analyzeVisualStyle(
  sample: VideoStyleSample,
  metadata?: {
    title?: string
    description?: string
    duration?: number
    channelName?: string
  },
  isPremium: boolean = false
): Promise<VisualStyleProfile> {
  const model = isPremium ? PREMIUM_MODEL : DEFAULT_MODEL
  const frameBuffers = await Promise.all(
    sample.frames.map(async (frame) => ({
      ...frame,
      image: await fs.readFile(frame.path),
    }))
  )

  const contextLines = [
    metadata?.title ? `Video Title: ${metadata.title}` : null,
    metadata?.channelName ? `Channel Name: ${metadata.channelName}` : null,
    metadata?.description ? `Video Description: ${metadata.description}` : null,
    metadata?.duration ? `Video Duration: ${metadata.duration} seconds` : null,
    `Analyzed Window: ${sample.analysisDuration.toFixed(1)} seconds`,
    `Detected Scene Changes: ${sample.sceneMetrics.sceneCount}`,
    `Cuts Per Minute: ${sample.sceneMetrics.cutsPerMinute}`,
    `Average Shot Length: ${sample.sceneMetrics.averageShotLength} seconds`,
  ].filter(Boolean)

  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: Buffer; mediaType: 'image/jpeg' }
  > = [
    {
      type: 'text',
      text: `Analyze this creator's visual editing style from sampled frames.\n\n${contextLines.join('\n')}`,
    },
  ]

  for (const [index, frame] of frameBuffers.entries()) {
    userContent.push({
      type: 'text',
      text: `Frame ${index + 1} at ${frame.timestamp.toFixed(1)} seconds`,
    })
    userContent.push({
      type: 'image',
      image: frame.image,
      mediaType: 'image/jpeg',
    })
  }

  const systemPrompt = `You are a Japanese YouTube style analyst focused on visible editing patterns.

Use the sampled frames and the numeric scene metrics together.

Rules:
1. Describe only what is visually supported by the frames and scene metrics.
2. If subtitles are not visible often enough, lower confidence by choosing conservative labels.
3. Use the scene metrics directly for jump-cut related fields.
4. Keep notes concrete and short.
5. Dominant colors can be rough hex values or common color names.
6. B-roll means shots that are not the main talking-head presentation.
7. If the camera distance varies a lot, choose "mixed".`

  const { object } = await generateObject({
    model: openrouter(model),
    schema: VisualStyleSchema,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  })

  return {
    ...object,
    pacingStyle: {
      ...object.pacingStyle,
      sceneCount: sample.sceneMetrics.sceneCount,
      cutsPerMinute: sample.sceneMetrics.cutsPerMinute,
      averageShotLength: sample.sceneMetrics.averageShotLength,
    },
  }
}

// ============================================
// Audio Transcription (Deepgram primary, local whisper fallback)
// ============================================
export async function transcribeAudio(
  audioPath: string,
  language: string = 'ja'
): Promise<ASRResult> {
  try {
    await fs.access(audioPath)
  } catch {
    throw new Error(`Audio file not found: ${audioPath}`)
  }

  if (DEEPGRAM_API_KEY) {
    try {
      return await transcribeWithDeepgram(audioPath, language)
    } catch (error) {
      const deepgramError = getErrorMessage(error)
      console.warn(`Deepgram transcription failed, falling back to local whisper: ${deepgramError}`)

      try {
        return await transcribeWithLocalWhisper(audioPath, language)
      } catch (fallbackError) {
        throw new Error(
          `Deepgram transcription failed (${deepgramError}); local whisper fallback also failed: ${getErrorMessage(fallbackError)}`
        )
      }
    }
  }

  return transcribeWithLocalWhisper(audioPath, language)
}

async function transcribeWithDeepgram(audioPath: string, language: string): Promise<ASRResult> {
  if (!deepgram) {
    throw new Error('Deepgram client is not configured')
  }

  const response = await deepgram.listen.v1.media.transcribeFile(
    createReadStream(audioPath),
    {
      model: DEEPGRAM_MODEL,
      language,
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      utterances: true,
    }
  )

  if (!('results' in response) || !response.results) {
    throw new Error('Deepgram transcription did not return transcript results')
  }

  const transcript =
    response.results.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || ''

  const utteranceSegments = response.results.utterances
    ?.map((utterance) => ({
      start: utterance.start ?? 0,
      end: utterance.end ?? utterance.start ?? 0,
      text: utterance.transcript?.trim() || '',
      speaker:
        utterance.speaker !== undefined ? String(utterance.speaker) : undefined,
    }))
    .filter((segment) => segment.text.length > 0)

  if (utteranceSegments && utteranceSegments.length > 0) {
    return {
      text: transcript,
      segments: utteranceSegments,
    }
  }

  const words = response.results.channels?.[0]?.alternatives?.[0]?.words || []
  if (words.length > 0) {
    const start = words[0]?.start ?? 0
    const end = words[words.length - 1]?.end ?? start
    // Japanese text should not have spaces between words
    const separator = /^(ja|zh|ko)/.test(language) ? '' : ' '
    const text = words
      .map((word) => word.word || '')
      .join(separator)
      .trim()

    return {
      text: transcript || text,
      segments: text
        ? [
            {
              start,
              end,
              text,
            },
          ]
        : [],
    }
  }

  return {
    text: transcript,
    segments: transcript
      ? [
          {
            start: 0,
            end: 0,
            text: transcript,
          },
        ]
      : [],
  }
}

async function transcribeWithLocalWhisper(audioPath: string, language: string): Promise<ASRResult> {
  const { spawn } = await import('child_process')
  const path = await import('path')
  const tmpDir = path.dirname(audioPath)

  return new Promise((resolve, reject) => {
    const args = [
      audioPath,
      '--language', language,
      '--output_format', 'json',
      '--output_dir', tmpDir,
      '--model', 'base',
      '--fp16', 'False',
    ]

    const whisper = spawn('whisper', args)
    let stderr = ''

    whisper.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    whisper.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Local whisper failed: ${stderr}`))
        return
      }

      try {
        const jsonPath = audioPath.replace(/\.[^.]+$/, '.json')
        const content = await fs.readFile(jsonPath, 'utf-8')
        const data = JSON.parse(content) as LocalWhisperResponse

        const segments: ASRResult['segments'] = (data.segments || []).map((seg: WhisperSegment) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
          speaker: undefined,
        }))

        resolve({ text: data.text || '', segments })

        try { await fs.unlink(jsonPath) } catch {}
      } catch (parseError) {
        reject(new Error(`Failed to parse whisper output: ${parseError}`))
      }
    })

    whisper.on('error', (err) => {
      reject(new Error(`Failed to run whisper CLI. Install with: pip install openai-whisper. Error: ${err.message}`))
    })
  })
}

// ============================================
// Subtitle Generation
// ============================================
export async function generateSubtitles(
  transcript: string,
  segments: Array<{ start: number; end: number; text: string }>,
  style: StyleAnalysisResult['subtitleSettings'],
  isPremium: boolean = false
): Promise<Array<{ start: number; end: number; text: string }>> {
  if (segments && segments.length > 0) {
    return segments
  }

  if (!transcript || transcript.trim().length === 0) {
    console.warn('No transcript available for subtitle generation')
    return []
  }

  const SubtitleSchema = z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      text: z.string(),
    })
  )

  const model = isPremium ? PREMIUM_MODEL : DEFAULT_MODEL

  const systemPrompt = `You are a subtitle timing expert for Japanese video content.

Split the transcript into well-timed subtitle segments for short-form video (TikTok, Shorts, Reels).

Rules:
1. 1-2 lines maximum per subtitle
2. 20-25 characters max per line for Japanese
3. Display time: 2-5 seconds
4. Break at natural sentence boundaries
5. Reading speed: ~3-5 characters per second

Style: ${JSON.stringify(style)}`

  const { object } = await generateObject({
    model: openrouter(model),
    schema: SubtitleSchema,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate timed subtitles for:\n\n${transcript}` },
    ],
    temperature: 0.3,
  })

  return object
}

// ============================================
// SRT Generation
// ============================================
export function generateSRT(subtitles: Array<{ start: number; end: number; text: string }>): string {
  return subtitles
    .map((sub, index) => {
      const start = formatSRTTime(sub.start)
      const end = formatSRTTime(sub.end)
      return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`
    })
    .join('\n')
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

// ============================================
// Silence Detection (Waveform)
// ============================================
export async function detectSilence(
  waveform: number[],
  threshold: number = 0.02,
  minDuration: number = 0.3
): Promise<Array<{ start: number; end: number }>> {
  const silenceSegments: Array<{ start: number; end: number }> = []
  let inSilence = false
  let silenceStart = 0

  for (let i = 0; i < waveform.length; i++) {
    if (waveform[i] < threshold) {
      if (!inSilence) {
        inSilence = true
        silenceStart = i
      }
    } else {
      if (inSilence) {
        const duration = i - silenceStart
        if (duration >= minDuration * 100) {
          silenceSegments.push({
            start: silenceStart / 100,
            end: i / 100,
          })
        }
        inSilence = false
      }
    }
  }

  return silenceSegments
}

// ============================================
// Model Info Export
// ============================================
export const modelInfo = {
  default: DEFAULT_MODEL,
  premium: PREMIUM_MODEL,
  isFree: (model: string) => model.includes(':free'),
}

const aiClient = {
  chatCompletion,
  streamChatCompletion,
  analyzeStyle,
  analyzeVisualStyle,
  transcribeAudio,
  generateSubtitles,
  generateSRT,
  detectSilence,
  modelInfo,
}

export default aiClient
