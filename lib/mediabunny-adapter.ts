import { promises as fs } from 'fs'

export interface MediabunnyVideoMetadata {
  duration: number
  width: number
  height: number
  bitrate?: number
  codec?: string
  format?: string
}

type MediabunnyModule = typeof import('mediabunny')

async function loadMediabunny(): Promise<MediabunnyModule> {
  return import('mediabunny')
}

function canDecodeVideoInCurrentRuntime() {
  return (
    typeof VideoDecoder !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined'
  )
}

function canDecodeAudioInCurrentRuntime() {
  return (
    typeof AudioDecoder !== 'undefined' &&
    typeof AudioBuffer !== 'undefined'
  )
}

async function withInput<T>(
  inputPath: string,
  callback: (args: {
    input: InstanceType<MediabunnyModule['Input']>
    mediabunny: MediabunnyModule
  }) => Promise<T>,
): Promise<T> {
  await fs.access(inputPath)
  const mediabunny = await loadMediabunny()
  const input = new mediabunny.Input({
    formats: mediabunny.ALL_FORMATS,
    source: new mediabunny.FilePathSource(inputPath),
  })

  try {
    return await callback({ input, mediabunny })
  } finally {
    input.dispose()
  }
}

export async function getMediaDurationWithMediabunny(inputPath: string): Promise<number> {
  return withInput(inputPath, async ({ input }) => {
    return input.computeDuration()
  })
}

export async function getMediaMetadataWithMediabunny(
  inputPath: string,
): Promise<MediabunnyVideoMetadata> {
  return withInput(inputPath, async ({ input }) => {
    const duration = await input.computeDuration()
    const format = await input.getFormat()
    const videoTrack = await input.getPrimaryVideoTrack()

    const codec = videoTrack?.codec ?? undefined
    const width = videoTrack?.displayWidth ?? 0
    const height = videoTrack?.displayHeight ?? 0
    const bitrate = videoTrack
      ? (await videoTrack.computePacketStats(240)).averageBitrate
      : undefined

    return {
      duration,
      width,
      height,
      bitrate,
      codec: codec ?? undefined,
      format: format.name,
    }
  })
}

export async function generateThumbnailWithMediabunny(
  inputPath: string,
  outputPath: string,
  timestamp: number,
): Promise<boolean> {
  void inputPath
  void outputPath
  void timestamp

  if (!canDecodeVideoInCurrentRuntime()) {
    return false
  }

  return false
}

export async function generateWaveformWithMediabunny(
  inputPath: string,
  samples: number,
): Promise<number[] | null> {
  void inputPath
  void samples

  if (!canDecodeAudioInCurrentRuntime()) {
    return null
  }

  return null
}
