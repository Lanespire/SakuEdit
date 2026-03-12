import { promises as fs } from 'fs'
import * as path from 'path'

export interface MediabunnyVideoMetadata {
  duration: number
  width: number
  height: number
  bitrate?: number
  codec?: string
  format?: string
}

export interface DetailedMediaInfo {
  duration: number
  width: number
  height: number
  bitrate: number
  codec: string
  format: string
  audioCodec?: string
  audioChannels?: number
  audioSampleRate?: number
  frameRate?: number
  totalFrames?: number
}

export interface ConvertVideoOptions {
  outputPath: string
  videoCodec?: string
  audioCodec?: string
  width?: number
  height?: number
  videoBitrate?: number
  audioBitrate?: number
  trim?: { start?: number; end?: number }
  onProgress?: (progress: number) => void
}

export interface ConvertVideoResult {
  success: boolean
  outputPath?: string
  error?: string
}

export interface ExtractedFrame {
  path: string
  timestamp: number
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

async function canvasToBuffer(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Buffer | null> {
  if ('convertToBlob' in canvas) {
    const blob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
    return Buffer.from(await blob.arrayBuffer())
  }
  return null
}

// ---------------------------------------------------------------------------
// Metadata (no decoder required — works in Node.js)
// ---------------------------------------------------------------------------

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

/**
 * Get detailed media information using MediaBunny's demuxer APIs.
 * Works purely at the container/packet level — no WebCodecs decoders required.
 */
export async function getDetailedMediaInfo(inputPath: string): Promise<DetailedMediaInfo> {
  return withInput(inputPath, async ({ input }) => {
    const duration = await input.computeDuration()
    const format = await input.getFormat()
    const videoTrack = await input.getPrimaryVideoTrack()
    const audioTrack = await input.getPrimaryAudioTrack()

    let width = 0
    let height = 0
    let bitrate = 0
    let codec = ''
    let frameRate: number | undefined
    let totalFrames: number | undefined

    if (videoTrack) {
      width = videoTrack.displayWidth
      height = videoTrack.displayHeight
      codec = videoTrack.codec ?? ''

      const videoStats = await videoTrack.computePacketStats()
      bitrate = videoStats.averageBitrate
      frameRate = videoStats.averagePacketRate
      totalFrames = videoStats.packetCount
    }

    let audioCodec: string | undefined
    let audioChannels: number | undefined
    let audioSampleRate: number | undefined

    if (audioTrack) {
      audioCodec = audioTrack.codec ?? undefined
      audioChannels = audioTrack.numberOfChannels
      audioSampleRate = audioTrack.sampleRate
    }

    return {
      duration,
      width,
      height,
      bitrate,
      codec,
      format: format.name,
      audioCodec,
      audioChannels,
      audioSampleRate,
      frameRate,
      totalFrames,
    }
  })
}

// ---------------------------------------------------------------------------
// Video frame extraction (requires VideoDecoder + OffscreenCanvas)
// ---------------------------------------------------------------------------

/**
 * Generate a thumbnail image at the given timestamp.
 * Requires VideoDecoder + OffscreenCanvas (browser-only). Returns false in
 * Node.js so the caller can fall back to FFmpeg.
 */
export async function generateThumbnailWithMediabunny(
  inputPath: string,
  outputPath: string,
  timestamp: number,
): Promise<boolean> {
  if (!canDecodeVideoInCurrentRuntime()) {
    return false
  }

  try {
    return await withInput(inputPath, async ({ input, mediabunny }) => {
      const videoTrack = await input.getPrimaryVideoTrack()
      if (!videoTrack) return false

      const sink = new mediabunny.CanvasSink(videoTrack)
      const wrapped = await sink.getCanvas(timestamp)
      if (!wrapped) return false

      const buf = await canvasToBuffer(wrapped.canvas)
      if (!buf) return false

      await fs.writeFile(outputPath, buf)
      return true
    })
  } catch {
    return false
  }
}

/**
 * Extract a single video frame at the given timestamp and write it to outputPath.
 * Returns null if the runtime lacks WebCodecs support.
 */
export async function extractFrameAtTimestamp(
  inputPath: string,
  outputPath: string,
  timestamp: number,
  options?: { width?: number; height?: number },
): Promise<ExtractedFrame | null> {
  if (!canDecodeVideoInCurrentRuntime()) {
    return null
  }

  try {
    return await withInput(inputPath, async ({ input, mediabunny }) => {
      const videoTrack = await input.getPrimaryVideoTrack()
      if (!videoTrack) return null

      const sinkOpts: Record<string, unknown> = {}
      if (options?.width) sinkOpts.width = options.width
      if (options?.height) sinkOpts.height = options.height

      const sink = new mediabunny.CanvasSink(
        videoTrack,
        sinkOpts as ConstructorParameters<typeof mediabunny.CanvasSink>[1],
      )
      const wrapped = await sink.getCanvas(timestamp)
      if (!wrapped) return null

      const buf = await canvasToBuffer(wrapped.canvas)
      if (!buf) return null

      await fs.writeFile(outputPath, buf)
      return { path: outputPath, timestamp: wrapped.timestamp }
    })
  } catch {
    return null
  }
}

/**
 * Extract video frames at multiple timestamps, writing each as a PNG file
 * into outputDir. Uses CanvasSink.canvasesAtTimestamps for optimal decoding
 * (each packet decoded at most once when timestamps are sorted).
 * Returns null if the runtime lacks WebCodecs support.
 */
export async function extractFramesAtTimestamps(
  inputPath: string,
  outputDir: string,
  timestamps: number[],
  options?: { width?: number; height?: number },
): Promise<ExtractedFrame[] | null> {
  if (!canDecodeVideoInCurrentRuntime()) {
    return null
  }

  try {
    await fs.mkdir(outputDir, { recursive: true })

    return await withInput(inputPath, async ({ input, mediabunny }) => {
      const videoTrack = await input.getPrimaryVideoTrack()
      if (!videoTrack) return null

      const sinkOpts: Record<string, unknown> = {}
      if (options?.width) sinkOpts.width = options.width
      if (options?.height) sinkOpts.height = options.height

      const sink = new mediabunny.CanvasSink(
        videoTrack,
        sinkOpts as ConstructorParameters<typeof mediabunny.CanvasSink>[1],
      )

      const sorted = [...timestamps].sort((a, b) => a - b)
      const frames: ExtractedFrame[] = []
      let index = 0

      for await (const wrapped of sink.canvasesAtTimestamps(sorted)) {
        if (wrapped) {
          const outPath = path.join(outputDir, `frame-${index + 1}.png`)
          const buf = await canvasToBuffer(wrapped.canvas)
          if (buf) {
            await fs.writeFile(outPath, buf)
            frames.push({ path: outPath, timestamp: wrapped.timestamp })
          }
        }
        index++
      }

      return frames
    })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Audio waveform & buffer extraction (requires AudioDecoder)
// ---------------------------------------------------------------------------

/**
 * Generate waveform data (array of RMS amplitudes 0–1) by decoding audio
 * samples via AudioSampleSink. Returns null if AudioDecoder is unavailable.
 */
export async function generateWaveformWithMediabunny(
  inputPath: string,
  samples: number,
): Promise<number[] | null> {
  if (!canDecodeAudioInCurrentRuntime()) {
    return null
  }

  try {
    return await withInput(inputPath, async ({ input, mediabunny }) => {
      const audioTrack = await input.getPrimaryAudioTrack()
      if (!audioTrack) return null

      const duration = await audioTrack.computeDuration()
      if (duration <= 0) return null

      const segmentDuration = duration / samples
      const waveform: number[] = []

      const sink = new mediabunny.AudioSampleSink(audioTrack)

      for (let i = 0; i < samples; i++) {
        const timestamp = (i + 0.5) * segmentDuration
        const sample = await sink.getSample(timestamp)

        if (!sample) {
          waveform.push(0)
          continue
        }

        // Compute RMS from f32-planar data across all channels.
        const channels = sample.numberOfChannels
        let sumSquares = 0
        let totalSamples = 0

        for (let ch = 0; ch < channels; ch++) {
          const byteSize = sample.allocationSize({
            planeIndex: ch,
            format: 'f32-planar',
          })
          const buffer = new ArrayBuffer(byteSize)
          sample.copyTo(buffer, {
            planeIndex: ch,
            format: 'f32-planar',
          })
          const floats = new Float32Array(buffer)
          for (let j = 0; j < floats.length; j++) {
            sumSquares += floats[j] * floats[j]
          }
          totalSamples += floats.length
        }

        sample.close()

        const rms = totalSamples > 0 ? Math.sqrt(sumSquares / totalSamples) : 0
        waveform.push(Math.min(1, Math.max(0, rms)))
      }

      return waveform
    })
  } catch {
    return null
  }
}

/**
 * Extract decoded audio as an AudioBuffer using AudioBufferSink.
 * Returns null if the runtime lacks AudioDecoder support.
 *
 * Optionally trim to a time range via startTime/endTime.
 */
export async function extractAudioBuffer(
  inputPath: string,
  options?: { startTime?: number; endTime?: number },
): Promise<AudioBuffer | null> {
  if (!canDecodeAudioInCurrentRuntime()) {
    return null
  }

  try {
    return await withInput(inputPath, async ({ input, mediabunny }) => {
      const audioTrack = await input.getPrimaryAudioTrack()
      if (!audioTrack) return null

      const sink = new mediabunny.AudioBufferSink(audioTrack)

      // Collect all WrappedAudioBuffer instances from the requested range
      const buffers: AudioBuffer[] = []
      for await (const wrapped of sink.buffers(options?.startTime, options?.endTime)) {
        buffers.push(wrapped.buffer)
      }

      if (buffers.length === 0) return null
      if (buffers.length === 1) return buffers[0]

      // Merge multiple AudioBuffers into one.
      const sampleRate = buffers[0].sampleRate
      const channels = buffers[0].numberOfChannels
      const totalLength = buffers.reduce((acc, b) => acc + b.length, 0)

      // We need an AudioContext (or OfflineAudioContext) to create an AudioBuffer.
      // This is available in browser/Deno but not in Node.js by default.
      if (typeof OfflineAudioContext === 'undefined') {
        // Fall back to returning just the first buffer if we can't merge
        return buffers[0]
      }

      const ctx = new OfflineAudioContext(channels, totalLength, sampleRate)
      const merged = ctx.createBuffer(channels, totalLength, sampleRate)
      let offset = 0
      for (const buf of buffers) {
        for (let ch = 0; ch < channels; ch++) {
          merged.getChannelData(ch).set(buf.getChannelData(ch), offset)
        }
        offset += buf.length
      }

      return merged
    })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Video conversion (requires WebCodecs — VideoDecoder + VideoEncoder)
// ---------------------------------------------------------------------------

/**
 * Convert a video file using MediaBunny's Conversion API.
 * Requires WebCodecs (VideoDecoder/VideoEncoder, AudioDecoder/AudioEncoder).
 * Returns { success: false } in Node.js so the caller can fall back to FFmpeg.
 */
export async function convertVideoWithMediabunny(
  inputPath: string,
  options: ConvertVideoOptions,
): Promise<ConvertVideoResult> {
  // Conversion requires both decoding and encoding capabilities
  if (!canDecodeVideoInCurrentRuntime()) {
    return { success: false, error: 'VideoDecoder/OffscreenCanvas not available in current runtime' }
  }

  try {
    await fs.access(inputPath)
    const mediabunny = await loadMediabunny()

    const input = new mediabunny.Input({
      formats: mediabunny.ALL_FORMATS,
      source: new mediabunny.FilePathSource(inputPath),
    })

    const output = new mediabunny.Output({
      format: new mediabunny.Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new mediabunny.FilePathTarget(options.outputPath),
    })

    try {
      const conversionOptions: Parameters<typeof mediabunny.Conversion.init>[0] = {
        input,
        output,
        trim: options.trim,
        showWarnings: false,
      }

      // Video options
      if (options.width || options.height || options.videoCodec || options.videoBitrate) {
        conversionOptions.video = {
          width: options.width,
          height: options.height,
          codec: options.videoCodec as Parameters<typeof mediabunny.Conversion.init>[0]['video'] extends
            | infer V
            | undefined
            ? V extends { codec?: infer C }
              ? C
              : never
            : never,
          bitrate: options.videoBitrate,
        }
      }

      // Audio options
      if (options.audioCodec || options.audioBitrate) {
        conversionOptions.audio = {
          codec: options.audioCodec as Parameters<typeof mediabunny.Conversion.init>[0]['audio'] extends
            | infer A
            | undefined
            ? A extends { codec?: infer C }
              ? C
              : never
            : never,
          bitrate: options.audioBitrate,
        }
      }

      const conversion = await mediabunny.Conversion.init(conversionOptions)

      if (!conversion.isValid) {
        const reasons = conversion.discardedTracks.map((d) => `${d.reason}`).join(', ')
        return { success: false, error: `Conversion invalid: ${reasons}` }
      }

      if (options.onProgress) {
        conversion.onProgress = options.onProgress
      }

      await conversion.execute()
      return { success: true, outputPath: options.outputPath }
    } finally {
      input.dispose()
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown conversion error',
    }
  }
}

// ---------------------------------------------------------------------------
// Subtitle embedding (requires WebCodecs for video re-encoding)
// ---------------------------------------------------------------------------

export interface EmbedSubtitlesOptions {
  outputPath: string
  subtitles: string  // WebVTT format string
  trim?: { start?: number; end?: number }
}

/**
 * Embed WebVTT subtitles into a video file using MediaBunny's Conversion API
 * with TextSubtitleSource. Requires WebCodecs for video/audio transcoding.
 * Returns { success: false } in Node.js.
 */
export async function embedSubtitlesWithMediabunny(
  inputPath: string,
  options: EmbedSubtitlesOptions,
): Promise<ConvertVideoResult> {
  if (!canDecodeVideoInCurrentRuntime()) {
    return { success: false, error: 'WebCodecs not available in current runtime' }
  }

  try {
    await fs.access(inputPath)
    const mediabunny = await loadMediabunny()

    const input = new mediabunny.Input({
      formats: mediabunny.ALL_FORMATS,
      source: new mediabunny.FilePathSource(inputPath),
    })

    // Use MKV format since it supports WebVTT subtitle tracks
    const output = new mediabunny.Output({
      format: new mediabunny.MkvOutputFormat(),
      target: new mediabunny.FilePathTarget(options.outputPath),
    })

    try {
      const conversion = await mediabunny.Conversion.init({
        input,
        output,
        trim: options.trim,
        showWarnings: false,
      })

      if (!conversion.isValid) {
        const reasons = conversion.discardedTracks.map((d) => `${d.reason}`).join(', ')
        return { success: false, error: `Conversion invalid: ${reasons}` }
      }

      // Add subtitle track
      const subtitleSource = new mediabunny.TextSubtitleSource('webvtt')
      output.addSubtitleTrack(subtitleSource)

      // Start output, add subtitle text, close source
      await output.start()
      await subtitleSource.add(options.subtitles)
      subtitleSource.close()

      await conversion.execute()
      return { success: true, outputPath: options.outputPath }
    } finally {
      input.dispose()
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown embed subtitles error',
    }
  }
}

// ---------------------------------------------------------------------------
// Runtime capability check
// ---------------------------------------------------------------------------

/**
 * Check whether the current runtime can process media of the given MIME type
 * through MediaBunny's decode pipeline (video + audio).
 *
 * Container format parsing always works (pure JS), but actual frame decoding
 * requires VideoDecoder / AudioDecoder which are browser-only.
 */
export async function canProcessInBrowser(mimeType: string): Promise<boolean> {
  const hasVideo = canDecodeVideoInCurrentRuntime()
  const hasAudio = canDecodeAudioInCurrentRuntime()

  if (!hasVideo && !hasAudio) {
    return false
  }

  const isAudioOnly = mimeType.startsWith('audio/')
  if (isAudioOnly) {
    return hasAudio
  }

  return hasVideo
}
