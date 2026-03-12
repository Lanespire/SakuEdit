import { promises as fs } from 'fs'
import * as path from 'path'
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type WhisperModel,
} from '@remotion/install-whisper-cpp'
import type { Language } from '@remotion/install-whisper-cpp'
import { captionsToSegments } from './remotion-captions-adapter'

const WHISPER_CPP_VERSION = process.env.WHISPER_CPP_VERSION || '1.7.4'
const WHISPER_MODEL = (process.env.WHISPER_MODEL as WhisperModel | undefined) || 'base'
const WHISPER_ROOT = process.env.WHISPER_ROOT || path.join(process.cwd(), '.cache', 'remotion-whisper')
const WHISPER_MODEL_DIR = path.join(WHISPER_ROOT, 'models')

export interface RemotionWhisperResult {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}

let ensureRuntimePromise: Promise<void> | null = null

async function ensureWhisperRuntime() {
  if (ensureRuntimePromise) {
    return ensureRuntimePromise
  }

  ensureRuntimePromise = (async () => {
    await fs.mkdir(WHISPER_ROOT, { recursive: true })
    await fs.mkdir(WHISPER_MODEL_DIR, { recursive: true })

    await installWhisperCpp({
      version: WHISPER_CPP_VERSION,
      to: WHISPER_ROOT,
      printOutput: false,
    })

    await downloadWhisperModel({
      model: WHISPER_MODEL,
      folder: WHISPER_MODEL_DIR,
      printOutput: false,
    })
  })()

  try {
    await ensureRuntimePromise
  } catch (error) {
    ensureRuntimePromise = null
    throw error
  }
}

export async function transcribeWithRemotionWhisper(
  inputPath: string,
  language: string = 'ja',
): Promise<RemotionWhisperResult> {
  await fs.access(inputPath)
  await ensureWhisperRuntime()

  const transcription = await transcribe({
    inputPath,
    whisperPath: WHISPER_ROOT,
    whisperCppVersion: WHISPER_CPP_VERSION,
    model: WHISPER_MODEL,
    modelFolder: WHISPER_MODEL_DIR,
    tokenLevelTimestamps: true,
    printOutput: false,
    language: language as Language,
    splitOnWord: language.startsWith('ja') ? false : true,
  })

  const { captions } = toCaptions({
    whisperCppOutput: transcription,
  })

  const segments = captionsToSegments(captions)
  const separator = /^(ja|zh|ko)/.test(language) ? '' : ' '
  const text = transcription.transcription
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join(separator)
    .trim()

  return {
    text,
    segments,
  }
}
