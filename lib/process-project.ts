import fs from 'fs/promises'
import path from 'path'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { resolveUserPlan } from '@/lib/billing'
import { canUseQuality, type ExportQuality } from '@/lib/plans'
import { transcribeAudio, generateSubtitles } from '@/lib/ai'
import { isDeepgramConfigured, transcribeWithDeepgram } from '@/lib/deepgram-adapter'
import { correctTranscription } from '@/lib/ai-text-correction'
import {
  detectSilence,
  extractAudio,
  generateThumbnail,
  generateWaveformData,
  processVideo,
} from '@/lib/video-processor'
import { serializeSegmentsToSrt } from '@/lib/remotion-captions-adapter'
import {
  buildProcessingArtifactObjectKey,
  buildProjectWorkingDir,
  materializeProjectAsset,
  uploadLocalStorageObject,
} from '@/lib/server/project-storage'
import {
  claimProcessingJob,
  markProcessingJobCompleted,
  markProcessingJobFailed,
  parseProcessingOptions,
  PROCESSING_PIPELINE_VERSION,
  updateProcessingProgress,
} from '@/lib/server/processing-jobs'

type CutSettings = {
  minSilence: number
  aggressiveness: 'low' | 'medium' | 'high'
  targetCutsPerMinute: number
}

type SubtitleSettings = {
  font: string
  size: number
  position: 'bottom' | 'middle' | 'top'
  color: string
  backgroundColor?: string
}

type BgmSettings = {
  genre: string
  volume: number
  tempo: 'slow' | 'medium' | 'fast'
}

type TempoSettings = {
  minClipDuration: number
  maxClipDuration: number
}

type ProcessingStyleSettings = {
  cutSettings: CutSettings
  subtitleSettings: SubtitleSettings
  bgmSettings: BgmSettings
  tempoSettings: TempoSettings
}

export type ProjectProcessingOptions = Record<string, unknown> | undefined

function getSilenceThresholdDb(aggressiveness: CutSettings['aggressiveness']) {
  switch (aggressiveness) {
    case 'low':
      return -30
    case 'high':
      return -40
    case 'medium':
    default:
      return -35
  }
}

function serializeSilenceRegions(
  regions: Array<{ startTime: number; endTime: number }>,
) {
  return regions.map((region) => ({
    start: region.startTime,
    end: region.endTime,
  }))
}

export async function runProjectProcessing({
  jobId,
}: {
  jobId: string
}) {
  let projectId: string | null = null
  try {
    const { job, claimed } = await claimProcessingJob(jobId)

    if (!claimed) {
      return {
        success: job.status === 'COMPLETED',
        projectId: job.projectId,
        skipped: true,
        status: job.status,
      }
    }

    const project = job.project
    projectId = project.id
    const resolvedProjectId = project.id
    const options = parseProcessingOptions(job.optionsJson)

    if (!project || !project.videos[0]) {
      throw new Error('Project or video not found')
    }

    const video = project.videos[0]
    const sourceStoragePath = video.storagePath

    if (!sourceStoragePath) {
      throw new Error('Video file path not found')
    }
    const processingDir = buildProjectWorkingDir(resolvedProjectId)
    await fs.rm(processingDir, { recursive: true, force: true }).catch(() => undefined)
    await fs.mkdir(processingDir, { recursive: true })

    const inputFileName = `input${path.extname(video.filename || sourceStoragePath) || '.mp4'}`
    const inputPath = await materializeProjectAsset(sourceStoragePath, {
      projectId: resolvedProjectId,
      fileName: inputFileName,
      workDir: processingDir,
    })

    try {
      await fs.access(inputPath)
    } catch {
      throw new Error('Input video not found')
    }

    const audioPath = path.join(processingDir, 'source-audio.wav')
    const srtPath = path.join(processingDir, 'subtitles.srt')
    const thumbnailPath = path.join(processingDir, 'thumbnail.jpg')
    const outputPath = path.join(processingDir, 'output.mp4')
    const artifactPipelineVersion = job.pipelineVersion || PROCESSING_PIPELINE_VERSION
    const outputVideoObjectKey = buildProcessingArtifactObjectKey(
      resolvedProjectId,
      artifactPipelineVersion,
      'output.mp4',
    )
    const audioObjectKey = buildProcessingArtifactObjectKey(
      resolvedProjectId,
      artifactPipelineVersion,
      'source-audio.wav',
    )
    const srtObjectKey = buildProcessingArtifactObjectKey(
      resolvedProjectId,
      artifactPipelineVersion,
      'subtitles.srt',
    )
    const thumbnailObjectKey = buildProcessingArtifactObjectKey(
      resolvedProjectId,
      artifactPipelineVersion,
      'thumbnail.jpg',
    )

    const defaultStyleSettings: ProcessingStyleSettings = {
      cutSettings: {
        minSilence: 0.3,
        aggressiveness: 'medium',
        targetCutsPerMinute: 15,
      },
      subtitleSettings: {
        font: 'Noto Sans JP',
        size: 24,
        position: 'bottom',
        color: '#FFFFFF',
        backgroundColor: '#00000080',
      },
      bgmSettings: {
        genre: 'upbeat',
        volume: 0.3,
        tempo: 'medium',
      },
      tempoSettings: {
        minClipDuration: 2,
        maxClipDuration: 10,
      },
    }

    const styleSettings: ProcessingStyleSettings = project.style
      ? {
          cutSettings: {
            ...defaultStyleSettings.cutSettings,
            ...((project.style.cutSettings as Partial<CutSettings> | null) ?? {}),
          },
          subtitleSettings: {
            ...defaultStyleSettings.subtitleSettings,
            ...((project.style.subtitleSettings as Partial<SubtitleSettings> | null) ?? {}),
          },
          bgmSettings: {
            ...defaultStyleSettings.bgmSettings,
            ...((project.style.bgmSettings as Partial<BgmSettings> | null) ?? {}),
          },
          tempoSettings: {
            ...defaultStyleSettings.tempoSettings,
            ...((project.style.tempoSettings as Partial<TempoSettings> | null) ?? {}),
          },
        }
      : defaultStyleSettings

    const shouldReuseExistingSubtitles =
      Boolean(options?.reuseExistingSubtitles) && project.subtitles.length > 0

    await updateProcessingProgress({
      jobId,
      projectId: resolvedProjectId,
      progress: 10,
      progressMessage: 'Extracting audio...',
    })

    const extractResult = await extractAudio(inputPath, audioPath, 16000)
    if (!extractResult.success || !extractResult.outputPath) {
      throw new Error(`Audio extraction failed: ${extractResult.error}`)
    }

    await updateProcessingProgress({
      jobId,
      projectId: resolvedProjectId,
      progress: 20,
      progressMessage: shouldReuseExistingSubtitles
        ? 'Reusing existing subtitles...'
        : 'Transcribing audio...',
    })

    let subtitles: Array<{ start: number; end: number; text: string }>

    if (shouldReuseExistingSubtitles) {
      subtitles = project.subtitles.map((subtitle) => ({
        start: subtitle.startTime,
        end: subtitle.endTime,
        text: subtitle.text,
      }))

      await prisma.subtitle.updateMany({
        where: { projectId: resolvedProjectId },
        data: {
          position: styleSettings.subtitleSettings.position,
          fontSize: styleSettings.subtitleSettings.size,
          fontColor: styleSettings.subtitleSettings.color,
          backgroundColor: styleSettings.subtitleSettings.backgroundColor,
        },
      })
    } else {
      // Determine transcription method based on user plan
      const { plan } = await resolveUserPlan(project.userId)
      const isPremium = plan.id !== 'free'
      const useDeepgram = isPremium && isDeepgramConfigured()

      let asrResult: { text: string; segments: Array<{ start: number; end: number; text: string }> }
      try {
        if (useDeepgram) {
          await updateProcessingProgress({
            jobId,
            projectId: resolvedProjectId,
            progress: 25,
            progressMessage: 'Deepgramで高精度文字起こし中...',
          })
          const dgResult = await transcribeWithDeepgram(audioPath, 'ja')
          asrResult = {
            text: dgResult.text,
            segments: dgResult.segments.map((s) => ({
              start: s.start,
              end: s.end,
              text: s.text,
            })),
          }
        } else {
          asrResult = await transcribeAudio(audioPath, 'ja')
        }
      } catch (error) {
        throw new Error(
          `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }

      // AI text correction (context-based fixing)
      await updateProcessingProgress({
        jobId,
        projectId: resolvedProjectId,
        progress: 35,
        progressMessage: 'AI文脈補正中...',
      })

      try {
        const corrected = await correctTranscription(asrResult.segments, isPremium)
        asrResult = {
          text: corrected.map((s) => s.text).join(''),
          segments: corrected.map((s) => ({ start: s.start, end: s.end, text: s.text })),
        }
      } catch (correctionError) {
        console.warn('AI text correction failed, using raw transcription:', correctionError)
        // Continue with uncorrected results
      }

      await updateProcessingProgress({
        jobId,
        projectId: resolvedProjectId,
        progress: 40,
        progressMessage: '字幕を生成中...',
      })

      subtitles = await generateSubtitles(
        asrResult.text,
        asrResult.segments,
        styleSettings.subtitleSettings,
        isPremium,
      )

      await prisma.subtitle.deleteMany({ where: { projectId: resolvedProjectId } })
      await prisma.subtitle.createMany({
        data: subtitles.map((sub) => ({
          projectId: resolvedProjectId,
          startTime: sub.start,
          endTime: sub.end,
          text: sub.text,
          style: 'default',
          position: styleSettings.subtitleSettings.position,
          fontSize: styleSettings.subtitleSettings.size,
          fontColor: styleSettings.subtitleSettings.color,
          backgroundColor: styleSettings.subtitleSettings.backgroundColor,
          isBold: false,
        })),
      })

      // Reset compositionData so the editor rebuilds from fresh DB subtitles
      await prisma.project.update({
        where: { id: resolvedProjectId },
        data: { compositionData: null },
      })
    }

    const srtContent = serializeSegmentsToSrt(subtitles)
    await fs.writeFile(srtPath, srtContent, 'utf-8')
    await uploadLocalStorageObject(audioObjectKey, audioPath, {
      contentType: 'audio/wav',
    })
    await uploadLocalStorageObject(srtObjectKey, srtPath, {
      contentType: 'text/plain; charset=utf-8',
    })

    await updateProcessingProgress({
      jobId,
      projectId: resolvedProjectId,
      progress: 60,
      progressMessage: 'Detecting silence...',
    })

    const silenceThreshold = getSilenceThresholdDb(styleSettings.cutSettings.aggressiveness)
    const silenceDuration = styleSettings.cutSettings.minSilence ?? 0.3
    const silenceRegions = await detectSilence(inputPath, silenceThreshold, silenceDuration)

    await updateProcessingProgress({
      jobId,
      projectId: resolvedProjectId,
      progress: 80,
      progressMessage: 'Rendering with Remotion...',
    })

    const requestedQuality =
      options?.quality === '720p' ||
      options?.quality === '1080p' ||
      options?.quality === '4k'
        ? (options.quality as ExportQuality)
        : null
    const { plan } = await resolveUserPlan(project.userId)
    const quality =
      requestedQuality && canUseQuality(plan.id, requestedQuality)
        ? requestedQuality
        : plan.maxQuality

    const result = await processVideo({
      inputPath,
      outputPath,
      silenceThreshold,
      silenceDuration,
      silenceRegions,
      subtitles: subtitles.map((sub) => ({
        text: sub.text,
        startTime: sub.start,
        endTime: sub.end,
        style: 'default',
      })),
      quality,
      format: 'mp4',
      watermark: Boolean(options?.watermark),
      onRenderHeartbeat: async (elapsedSeconds) => {
        await updateProcessingProgress({
          jobId,
          projectId: resolvedProjectId,
          progress: 80,
          progressMessage: `Rendering with Remotion... (${elapsedSeconds}s)`,
        })
      },
    })

    if (!result.success) {
      throw new Error(result.error || 'Video processing failed')
    }

    await updateProcessingProgress({
      jobId,
      projectId: resolvedProjectId,
      progress: 90,
      progressMessage: 'Generating thumbnail...',
    })

    await generateThumbnail(outputPath, thumbnailPath, 1, 1280, 720)
    await uploadLocalStorageObject(outputVideoObjectKey, outputPath, {
      contentType: 'video/mp4',
    })
    await uploadLocalStorageObject(thumbnailObjectKey, thumbnailPath, {
      contentType: 'image/jpeg',
    })

    const waveformData = await generateWaveformData(inputPath, 100)

    await prisma.video.update({
      where: { id: video.id },
      data: {
        duration: result.duration,
        silenceDetected: serializeSilenceRegions(silenceRegions) as Prisma.InputJsonValue,
        waveform: (waveformData.data ?? []) as Prisma.InputJsonValue,
        thumbnailUrl: `/api/thumbnail/${resolvedProjectId}`,
      },
    })

    await markProcessingJobCompleted({
      jobId,
      projectId: resolvedProjectId,
      progressMessage: 'Processing completed',
      outputVideoPath: outputVideoObjectKey,
      audioPath: audioObjectKey,
      srtPath: srtObjectKey,
      thumbnailPath: thumbnailObjectKey,
    })

    return {
      success: true,
      projectId: resolvedProjectId,
      jobId,
      outputPath: `/api/download/${resolvedProjectId}`,
      silenceRegions: serializeSilenceRegions(silenceRegions),
      duration: result.duration,
      playbackSegments: result.playbackSegments,
      subtitles,
      thumbnailUrl: `/api/thumbnail/${resolvedProjectId}`,
    }
  } catch (error) {
    console.error('Processing error:', error)
    if (projectId) {
      await markProcessingJobFailed({
        jobId,
        projectId,
        errorMessage: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
    throw error
  } finally {
    if (projectId) {
      await fs.rm(buildProjectWorkingDir(projectId), { recursive: true, force: true }).catch(
        () => undefined,
      )
    }
  }
}
