import { promises as fs } from 'fs'
import * as path from 'path'
import {
  toCaptions,
  transcribe,
  type WhisperModel,
} from '@remotion/install-whisper-cpp'
import type { Language } from '@remotion/install-whisper-cpp'
import { captionsToSegments } from './remotion-captions-adapter'

const DEFAULT_WHISPER_CPP_VERSION = '1.7.4'
const DEFAULT_WHISPER_MODEL: WhisperModel = 'base'

type WhisperRuntimeConfig = {
  whisperCppVersion: string
  whisperModel: WhisperModel
  whisperRoot: string
  whisperModelDir: string
  whisperModelPath: string
}

function isBuildBinLayout(version: string) {
  const [major = 0, minor = 0, patch = 0] = version
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0)

  if (major > 1) {
    return true
  }

  if (major < 1) {
    return false
  }

  if (minor > 7) {
    return true
  }

  if (minor < 7) {
    return false
  }

  return patch >= 4
}

export interface RemotionWhisperResult {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}

let whisperRuntimePromise: Promise<WhisperRuntimeConfig> | null = null

function getConfiguredWhisperVersion() {
  return process.env.WHISPER_CPP_VERSION || DEFAULT_WHISPER_CPP_VERSION
}

function getConfiguredWhisperModel() {
  return (process.env.WHISPER_MODEL as WhisperModel | undefined) || DEFAULT_WHISPER_MODEL
}

function getWhisperRootCandidates() {
  const configuredRoot = process.env.WHISPER_ROOT
  const processingRuntimeRoot = process.env.PROCESSING_RUNTIME_ROOT

  return [
    configuredRoot,
    processingRuntimeRoot ? path.join(processingRuntimeRoot, 'whisper') : null,
    '/opt/whisper',
    path.join(process.cwd(), '.cache', 'remotion-whisper'),
  ].filter((candidate): candidate is string => Boolean(candidate))
}

function getModelPathCandidates(root: string, whisperModel: WhisperModel) {
  const configuredModelPath = process.env.WHISPER_MODEL_PATH
  const configuredModelDir = process.env.WHISPER_MODEL_DIR
  const fileName = `ggml-${whisperModel}.bin`

  return [
    configuredModelPath,
    configuredModelDir ? path.join(configuredModelDir, fileName) : null,
    path.join(root, 'models', fileName),
  ].filter((candidate): candidate is string => Boolean(candidate))
}

async function findAccessiblePath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Keep searching for a pre-provisioned runtime.
    }
  }

  return null
}

async function resolveWhisperRuntime() {
  if (!whisperRuntimePromise) {
    whisperRuntimePromise = (async () => {
      const whisperCppVersion = getConfiguredWhisperVersion()
      const whisperModel = getConfiguredWhisperModel()

      for (const whisperRoot of getWhisperRootCandidates()) {
        const whisperExecutablePath = await findAccessiblePath([
          process.env.WHISPER_EXECUTABLE_PATH || '',
          isBuildBinLayout(whisperCppVersion)
            ? path.join(whisperRoot, 'build', 'bin', 'whisper-cli')
            : path.join(whisperRoot, 'main'),
        ].filter(Boolean))
        const whisperModelPath = await findAccessiblePath(
          getModelPathCandidates(whisperRoot, whisperModel),
        )

        if (!whisperExecutablePath || !whisperModelPath) {
          continue
        }

        return {
          whisperCppVersion,
          whisperModel,
          whisperRoot,
          whisperModelDir: path.dirname(whisperModelPath),
          whisperModelPath,
        }
      }

      throw new Error(
        [
          'Whisper runtime is not provisioned.',
          'Set WHISPER_ROOT/WHISPER_MODEL_PATH to a prebuilt runtime or mount a Lambda Layer under /opt.',
        ].join(' '),
      )
    })()
  }

  return whisperRuntimePromise
}

export async function verifyWhisperRuntime() {
  return resolveWhisperRuntime()
}

export async function transcribeWithRemotionWhisper(
  inputPath: string,
  language: string = 'ja',
): Promise<RemotionWhisperResult> {
  await fs.access(inputPath)
  const runtime = await resolveWhisperRuntime()

  const transcription = await transcribe({
    inputPath,
    whisperPath: runtime.whisperRoot,
    whisperCppVersion: runtime.whisperCppVersion,
    model: runtime.whisperModel,
    modelFolder: runtime.whisperModelDir,
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
