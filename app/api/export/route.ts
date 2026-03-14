import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  calculateExportChargeSeconds,
  getBillingSnapshot,
  validateExportAccess,
} from '@/lib/billing'
import prisma from '@/lib/db'
import { getPlaybackSegments, normalizeSilenceRegions } from '@/lib/editor'
import type { ExportQuality, SubtitleExportOption } from '@/lib/plans'
import { serializeSegmentsToSrt } from '@/lib/remotion-captions-adapter'
import { extractPersistedExportState } from '@/lib/rve-state'
import {
  uploadFileToVideoBucket,
  uploadTextToVideoBucket,
} from '@/lib/server/video-bucket'
import {
  generateThumbnail,
  renderWithRemotion,
} from '@/lib/video-processor'
import { createVideoBucketSignedGetUrl } from '@/lib/server/video-bucket'

function normalizeQuality(value: unknown): ExportQuality {
  return value === '1080p' || value === '4k' ? value : '720p'
}

function normalizeSubtitleOption(value: unknown): SubtitleExportOption {
  if (value === 'burned') return 'burn'
  if (value === 'separate') return 'srt'
  return value === 'srt' || value === 'both' ? value : 'burn'
}

function is4kSource(width?: number | null, height?: number | null) {
  if (!width || !height) {
    return true
  }

  const longEdge = Math.max(width, height)
  const shortEdge = Math.min(width, height)
  return longEdge >= 3840 && shortEdge >= 2160
}

function getRenderDimensions(quality: ExportQuality) {
  switch (quality) {
    case '4k':
      return { width: 3840, height: 2160 }
    case '1080p':
      return { width: 1920, height: 1080 }
    case '720p':
    default:
      return { width: 1280, height: 720 }
  }
}

function buildExportObjectKey(projectId: string, exportJobId: string, fileName: string) {
  return `projects/${projectId}/exports/${exportJobId}/${fileName}`
}

function getVideoContentType(format: string) {
  switch (format) {
    case 'mov':
      return 'video/quicktime'
    case 'webm':
      return 'video/webm'
    case 'mp4':
    default:
      return 'video/mp4'
  }
}

async function withTempDir<T>(projectId: string, exportJobId: string, cb: (dir: string) => Promise<T>) {
  const tempDir = path.join(tmpdir(), 'sakuedit-export', projectId, exportJobId)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    return await cb(tempDir)
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testUserId = url.searchParams.get('testUserId')
    const isTestMode = process.env.NODE_ENV !== 'production' && testUserId

    let userId: string

    if (isTestMode) {
      userId = testUserId!
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const body = await request.json()
    const {
      projectId,
      quality: requestedQuality = '720p',
      format = 'mp4',
      subtitleOption: requestedSubtitleOption = 'burn',
      removeWatermark = false,
      exportThumbnail = false,
    } = body
    const quality = normalizeQuality(requestedQuality)
    const subtitleOption = normalizeSubtitleOption(requestedSubtitleOption)

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: {
          where: { storagePath: { not: null } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        subtitles: true,
        style: true,
        aiSuggestions: true,
      },
    })

    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sourceVideo = project.videos[0]
    if (!sourceVideo?.storagePath) {
      return NextResponse.json({ error: 'No video source found' }, { status: 400 })
    }

    const billing = await getBillingSnapshot(userId)
    const plan = billing.plan
    const sourceDurationSeconds = Math.ceil(sourceVideo.duration || 0)
    const billedSeconds = calculateExportChargeSeconds(sourceDurationSeconds, quality)

    const accessError = validateExportAccess(plan.id, {
      quality,
      subtitleOption,
      removeWatermark,
      exportThumbnail,
    })

    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 })
    }

    if (sourceDurationSeconds > plan.maxSingleVideoMinutes * 60) {
      return NextResponse.json(
        {
          error: `現在のプランでは${plan.maxSingleVideoMinutes}分を超える動画は書き出せません`,
        },
        { status: 403 },
      )
    }

    if (quality === '4k' && !is4kSource(sourceVideo.width, sourceVideo.height)) {
      return NextResponse.json(
        { error: '4K書き出しは4Kソース動画でのみ利用できます' },
        { status: 400 },
      )
    }

    if (billedSeconds > billing.remainingSeconds) {
      return NextResponse.json(
        {
          error: '今月の処理分数が不足しています。上位プランへのアップグレードを検討してください',
        },
        { status: 402 },
      )
    }

    const exportJob = await prisma.exportJob.create({
      data: {
        projectId,
        status: 'PROCESSING',
        progress: 0,
        progressMessage: '書き出しを準備しています',
        quality,
        format,
      },
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'EXPORTING' },
    })

    try {
      const sourceObjectKey = sourceVideo.storagePath

      const sourceVideoUrl = await createVideoBucketSignedGetUrl(sourceObjectKey, {
        expiresInSeconds: 60 * 60 * 24,
        contentType: sourceVideo.mimeType || 'video/mp4',
      })
      const persistedExportState = extractPersistedExportState(project.compositionData)

      const subtitles = (persistedExportState?.subtitles.length
        ? persistedExportState.subtitles
        : project.subtitles.map((sub) => ({
        id: sub.id,
        text: sub.text,
        startTime: sub.startTime ?? 0,
        endTime: sub.endTime ?? 0,
        position: sub.position ?? 'bottom',
        fontSize: sub.fontSize ?? 24,
        fontColor: sub.fontColor ?? '#FFFFFF',
        backgroundColor: sub.backgroundColor ?? '#00000080',
        isBold: sub.isBold ?? false,
      }))).map((subtitle, index) => ({
        id: 'id' in subtitle ? subtitle.id : `rve-subtitle-${index}`,
        text: subtitle.text,
        startTime: subtitle.startTime ?? 0,
        endTime: subtitle.endTime ?? 0,
        position: subtitle.position ?? 'bottom',
        fontSize: subtitle.fontSize ?? 24,
        fontColor: subtitle.fontColor ?? '#FFFFFF',
        backgroundColor: subtitle.backgroundColor ?? '#00000080',
        isBold: subtitle.isBold ?? false,
      }))

      const { width, height } = getRenderDimensions(quality)
      const playbackSegments = persistedExportState?.playbackSegments ?? (() => {
        const cutApplied = project.aiSuggestions.some(
          (suggestion) => suggestion.type === 'SILENCE_CUT' && suggestion.isApplied,
        )
        return getPlaybackSegments(
          sourceVideo.duration,
          normalizeSilenceRegions(sourceVideo.silenceDetected),
          cutApplied,
        )
      })()

      let srtKey: string | null = null
      if ((subtitleOption === 'srt' || subtitleOption === 'both') && subtitles.length > 0) {
        srtKey = buildExportObjectKey(projectId, exportJob.id, 'subtitles.srt')
        await uploadTextToVideoBucket(srtKey, serializeSegmentsToSrt(
          subtitles.map((subtitle) => ({
            start: subtitle.startTime,
            end: subtitle.endTime,
            text: subtitle.text,
          })),
        ), {
          contentType: 'text/plain; charset=utf-8',
        })
      }

      const { videoKey, thumbnailKey } = await withTempDir(projectId, exportJob.id, async (tempDir) => {
        const outputPath = path.join(tempDir, `output.${format}`)
        const renderResult = await renderWithRemotion(
          'VideoComposition',
          {
            videoUrl: sourceVideoUrl,
            subtitles: subtitleOption === 'burn' || subtitleOption === 'both' ? subtitles : [],
            styleName: project.style?.name,
            playbackSegments,
            showStyleBadge: false,
            renderConfig: {
              width,
              height,
            },
          },
          outputPath,
        )

        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Video export failed')
        }

        const videoKey = buildExportObjectKey(projectId, exportJob.id, `video.${format}`)
        await uploadFileToVideoBucket(outputPath, videoKey, {
          contentType: getVideoContentType(format),
        })

        let thumbnailKey: string | null = null
        if (exportThumbnail) {
          const thumbnailPath = path.join(tempDir, 'thumbnail.jpg')
          const thumbnailResult = await generateThumbnail(outputPath, thumbnailPath, 1, 1280, 720)
          if (thumbnailResult.success) {
            thumbnailKey = buildExportObjectKey(projectId, exportJob.id, 'thumbnail.jpg')
            await uploadFileToVideoBucket(thumbnailPath, thumbnailKey, {
              contentType: 'image/jpeg',
            })
          }
        }

        return { videoKey, thumbnailKey }
      })

      const completedJob = await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          progressMessage: 'Export completed',
          completedAt: new Date(),
          sourceObjectKey,
          videoUrl: `/api/export/${projectId}/${exportJob.id}/video`,
          srtUrl: srtKey ? `/api/export/${projectId}/${exportJob.id}/srt` : null,
          thumbnailUrl: thumbnailKey ? `/api/export/${projectId}/${exportJob.id}/thumbnail` : null,
          videoPath: videoKey,
          srtPath: srtKey,
          thumbnailPath: thumbnailKey,
        },
      })

      await prisma.usageLog.create({
        data: {
          userId,
          action: 'export',
          resourceId: completedJob.id,
          duration: billedSeconds,
          metadata: {
            projectId,
            planId: plan.id,
            quality,
            billedSeconds,
            sourceDurationSeconds,
            subtitleOption,
            exportThumbnail,
            removeWatermark,
          },
        },
      })

      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETED', completedAt: new Date(), lastError: null },
      })

      return NextResponse.json({
        success: true,
        exportJob: completedJob,
        downloadUrl: completedJob.videoUrl,
        billing: {
          chargedSeconds: billedSeconds,
          remainingSeconds: Math.max(0, billing.remainingSeconds - billedSeconds),
        },
      })
    } catch (processError) {
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'FAILED',
          error: processError instanceof Error ? processError.message : 'Export failed',
          completedAt: new Date(),
        },
      })

      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ERROR', lastError: 'Export failed' },
      })

      throw processError
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export video' }, { status: 500 })
  }
}
