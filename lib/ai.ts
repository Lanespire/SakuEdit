/**
 * ZAI API Client for SakuEdit
 * Uses GLM-5 for style analysis, Groq Whisper for ASR
 */

import Groq from 'groq-sdk'
import fs from 'fs/promises'
import path from 'path'

const AI_API_KEY = process.env.AI_API_KEY
const AI_ENDPOINT = process.env.AI_ENDPOINT || 'https://api.z.ai/api/coding/paas/v4'
const GROQ_API_KEY = process.env.GROQ_API_KEY

interface AIResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface WhisperSegment {
  start: number
  end: number
  text: string
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

interface StyleAnalysisResult {
  cutSettings: {
    minSilence: number
    aggressiveness: 'low' | 'medium' | 'high'
    targetCutsPerMinute: number
  }
  subtitleSettings: {
    font: string
    size: number
    position: 'top' | 'middle' | 'bottom'
    color: string
    backgroundColor?: string
  }
  bgmSettings: {
    genre: string
    volume: number
    tempo: string
  }
  tempoSettings: {
    minClipDuration: number
    maxClipDuration: number
  }
}

/**
 * Send a chat completion request to ZAI API
 */
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number
    maxTokens?: number
    json?: boolean
  } = {}
): Promise<string> {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured')
  }

  // Append /chat/completions to the base endpoint if not already present
  const endpoint = AI_ENDPOINT!.endsWith('/chat/completions')
    ? AI_ENDPOINT
    : `${AI_ENDPOINT}/chat/completions`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-5',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.json ? { type: 'json_object' } : undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as AIResponse
  return data.choices[0]?.message?.content || ''
}

/**
 * Transcribe audio using Groq Whisper API or local whisper CLI
 * Falls back to local whisper CLI if GROQ_API_KEY is not configured
 */
export async function transcribeAudio(
  audioPath: string,
  language: string = 'ja'
): Promise<ASRResult> {
  // Check if audio file exists
  try {
    await fs.access(audioPath)
  } catch {
    throw new Error(`Audio file not found: ${audioPath}`)
  }

  // Try Groq API first if configured
  if (GROQ_API_KEY) {
    return transcribeWithGroq(audioPath, language)
  }

  // Fallback to local whisper CLI
  return transcribeWithLocalWhisper(audioPath, language)
}

/**
 * Transcribe using Groq Whisper API
 */
async function transcribeWithGroq(audioPath: string, language: string): Promise<ASRResult> {
  const groq = new Groq({ apiKey: GROQ_API_KEY! })

  try {
    // Read audio file and send to Groq Whisper API
    const file = await fs.readFile(audioPath)
    const fileBlob = new Blob([file])

    const transcription = await groq.audio.transcriptions.create({
      file: fileBlob as any,
      model: 'whisper-large-v3',
      language: language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    // Convert Groq response to ASRResult format
    const transcriptionData = transcription as any
    const segments: ASRResult['segments'] = (transcriptionData.segments || []).map((seg: WhisperSegment) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      speaker: undefined,
    }))

    return {
      text: transcription.text || '',
      segments,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Whisper transcription failed: ${error.message}`)
    }
    throw error
  }
}

/**
 * Transcribe using local whisper CLI (fallback)
 * Requires: pip install openai-whisper or brew install whisper
 */
async function transcribeWithLocalWhisper(audioPath: string, language: string): Promise<ASRResult> {
  const { spawn } = await import('child_process')
  const tmpDir = path.dirname(audioPath)

  return new Promise((resolve, reject) => {
    // Use whisper CLI with JSON output format
    const args = [
      audioPath,
      '--language', language,
      '--output_format', 'json',
      '--output_dir', tmpDir,
      '--model', 'base',  // Use base model for faster processing
      '--fp16', 'False',  // For CPU compatibility
    ]

    const whisper = spawn('whisper', args)
    let stderr = ''

    whisper.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    whisper.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Local whisper failed with code ${code}: ${stderr}`))
        return
      }

      try {
        // Read the JSON output file
        const jsonPath = audioPath.replace(/\.[^.]+$/, '.json')
        const content = await fs.readFile(jsonPath, 'utf-8')
        const data = JSON.parse(content)

        const segments: ASRResult['segments'] = (data.segments || []).map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text.trim(),
          speaker: undefined,
        }))

        resolve({
          text: data.text || '',
          segments,
        })

        // Clean up temp files
        try {
          await fs.unlink(jsonPath)
        } catch {}
      } catch (parseError) {
        reject(new Error(`Failed to parse whisper output: ${parseError}`))
      }
    })

    whisper.on('error', (err) => {
      reject(new Error(`Failed to run whisper CLI. Please install: pip install openai-whisper. Error: ${err.message}`))
    })
  })
}

/**
 * Analyze video editing style from transcript and metadata
 * This analyzes actual content, not just URL strings
 */
export async function analyzeStyle(
  transcript: string,
  metadata?: {
    title?: string
    description?: string
    duration?: number
    channelName?: string
  }
): Promise<StyleAnalysisResult> {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured')
  }

  const contextParts: string[] = []

  if (metadata?.title) {
    contextParts.push(`Video Title: ${metadata.title}`)
  }
  if (metadata?.channelName) {
    contextParts.push(`Channel Name: ${metadata.channelName}`)
  }
  if (metadata?.description) {
    contextParts.push(`Video Description: ${metadata.description}`)
  }
  if (metadata?.duration) {
    contextParts.push(`Duration: ${metadata.duration} seconds`)
  }

  contextParts.push(`Transcript: ${transcript}`)

  const prompt = `You are a video editing style analyst specializing in short-form content (YouTube Shorts, TikTok, Reels).

Analyze the following video content and determine the optimal editing style for creating engaging, fast-paced content.

${contextParts.join('\n\n')}

Analyze and return a JSON object with the following structure:
{
  "cutSettings": {
    "minSilence": 0.3,
    "aggressiveness": "medium",
    "targetCutsPerMinute": 15
  },
  "subtitleSettings": {
    "font": "Noto Sans JP",
    "size": 24,
    "position": "bottom",
    "color": "#FFFFFF",
    "backgroundColor": "#00000080"
  },
  "bgmSettings": {
    "genre": "upbeat",
    "volume": 0.3,
    "tempo": "medium"
  },
  "tempoSettings": {
    "minClipDuration": 2,
    "maxClipDuration": 10
  }
}

Analysis guidelines:
1. **Cut Settings**: Determine optimal silence detection and cut frequency based on content type
   - News/Educational: Moderate cuts (8-12/min), lower aggressiveness
   - Entertainment/Vlog: Fast cuts (15-20/min), high aggressiveness
   - Gaming/Tech: Very fast cuts (20-25/min), high aggressiveness
   - minSilence: 0.2-0.5 seconds typically

2. **Subtitle Settings**: Match the channel's subtitle style
   - Most Japanese YouTubers: Large, bold, bottom-positioned white text with black outline/background
   - Minimal style: Smaller, cleaner fonts
   - Bold style: Very large, highly visible text

3. **BGM Settings**: Suggest music that matches content mood
   - Educational/Tech: "upbeat", "lo-fi", "motivational"
   - Entertainment/Funny: "energetic", "comedy", "pop"
   - Gaming: "intense", "electronic", "dynamic"
   - Volume should be 0.2-0.4 to not overpower speech

4. **Tempo Settings**: Determine clip duration for optimal pacing
   - Fast-paced content: 2-4 seconds per clip
   - Moderate pacing: 4-7 seconds per clip
   - Storytelling: 5-10 seconds per clip`

  const result = await chatCompletion(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Analyze the video editing style based on the provided content.' },
    ],
    { json: true, temperature: 0.5 }
  )

  try {
    const parsed = JSON.parse(result) as StyleAnalysisResult

    // Validate the parsed result has required fields
    if (!parsed.cutSettings || !parsed.subtitleSettings || !parsed.bgmSettings || !parsed.tempoSettings) {
      throw new Error('Invalid style analysis response: missing required fields')
    }

    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse style analysis: ${error.message}`)
    }
    throw error
  }
}

/**
 * Generate subtitles with timing optimization from transcript
 */
export async function generateSubtitles(
  transcript: string,
  segments: Array<{ start: number; end: number; text: string }>,
  style: StyleAnalysisResult['subtitleSettings']
): Promise<Array<{ start: number; end: number; text: string }>> {
  // If we already have timed segments from ASR, use them directly
  if (segments && segments.length > 0) {
    return segments
  }

  // If there's no transcript, return empty subtitles rather than erroring
  if (!transcript || transcript.trim().length === 0) {
    console.warn('No transcript available for subtitle generation')
    return []
  }

  // Otherwise, use AI to split transcript into well-timed segments
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured')
  }

  const prompt = `You are a subtitle timing expert for Japanese video content.

Split the following transcript into well-timed subtitle segments optimized for short-form video platforms (TikTok, YouTube Shorts, Instagram Reels).

Transcript:
${transcript}

Style Settings: ${JSON.stringify(style)}

Rules for Japanese subtitles:
1. Each subtitle should be 1-2 lines maximum
2. Maximum 20-25 characters per line for Japanese text
3. Display time should be 2-5 seconds for short-form content
4. Break at natural sentence boundaries (bunsetsu, clause boundaries)
5. Avoid breaking in the middle of compound words
6. For long sentences, split into logical semantic chunks
7. Estimated reading speed: ~3-5 characters per second

Return a JSON array of subtitle segments:
[
  {"start": 0.0, "end": 3.5, "text": "最初の字幕"},
  {"start": 3.5, "end": 7.0, "text": "二つ目の字幕"}
]`

  const result = await chatCompletion(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Generate timed subtitles for this transcript.' },
    ],
    { json: true, temperature: 0.3 }
  )

  try {
    const parsed = JSON.parse(result)
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid subtitle generation response: expected array')
    }
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse subtitle response: ${error.message}`)
    }
    throw error
  }
}

/**
 * Convert subtitle segments to SRT format
 */
export function generateSRT(subtitles: Array<{ start: number; end: number; text: string }>): string {
  return subtitles
    .map((sub, index) => {
      // Convert seconds to SRT time format: HH:MM:SS,mmm
      const start = formatSRTTime(sub.start)
      const end = formatSRTTime(sub.end)
      return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`
    })
    .join('\n')
}

/**
 * Format time in seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

/**
 * Detect silence segments in audio waveform data (server-side)
 * This is used as fallback when FFmpeg silence detection is not available
 */
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

export default {
  chatCompletion,
  transcribeAudio,
  analyzeStyle,
  generateSubtitles,
  generateSRT,
  detectSilence,
}
