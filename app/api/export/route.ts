import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { exportVideo, generateSRTContent, generateThumbnail } from '@/lib/video-processor'
import {
  calculateExportChargeSeconds,
  getBillingSnapshot,
  validateExportAccess,
} from '@/lib/billing'
import type { ExportQuality, SubtitleExportOption } from '@/lib/plans'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

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

// POST /api/export - Create export job and process
export async function POST(request: NextRequest) {
  try {
    // Check for test mode (development only)
    const url = new URL(request.url)
    const testUserId = url.searchParams.get('testUserId')
    const isTestMode = process.env.NODE_ENV === 'development' && testUserId

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
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: {
          where: { storagePath: { not: null } },
        },
        subtitles: true,
      },
    })

    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.videos[0]?.storagePath) {
      return NextResponse.json(
        { error: 'No video source found' },
        { status: 400 }
      )
    }

    const billing = await getBillingSnapshot(userId)
    const plan = billing.plan
    const sourceVideo = project.videos[0]
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

    // Create export job
    const exportJob = await prisma.exportJob.create({
      data: {
        projectId,
        status: 'PROCESSING',
        progress: 0,
        quality,
        format,
      },
    })

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'EXPORTING' },
    })

    // Process export (synchronous for local dev, should be async in production)
    try {
      const inputPath = project.videos[0].storagePath
      const outputDir = path.join(UPLOAD_DIR, 'exports', projectId)
      await fs.mkdir(outputDir, { recursive: true })

      const outputFilename = `output_${Date.now()}.${format}`
      const outputPath = path.join(outputDir, outputFilename)

      // Prepare subtitles for burn-in
      const subtitles = project.subtitles.map(sub => ({
        text: sub.text,
        startTime: (sub.startTime ?? 0) / 1000, // Convert ms to seconds
        endTime: (sub.endTime ?? 0) / 1000,
      }))

      // Run FFmpeg export with quality and optional subtitle burn-in
      const exportResult = await exportVideo(inputPath, outputPath, {
        quality,
        format,
        subtitles: subtitleOption === 'burn' || subtitleOption === 'both' ? subtitles : [],
        burnSubtitles: subtitleOption === 'burn' || subtitleOption === 'both',
      })

      if (!exportResult.success) {
        throw new Error(exportResult.error || 'Video export failed')
      }

      // Generate thumbnail if requested
      let thumbnailPath: string | null = null
      if (exportThumbnail) {
        thumbnailPath = path.join(outputDir, `thumbnail_${Date.now()}.jpg`)
        const thumbResult = await generateThumbnail(outputPath, thumbnailPath, 1, 1280, 720)
        if (!thumbResult.success) {
          console.warn('Thumbnail generation failed:', thumbResult.error)
          thumbnailPath = null
        }
      }

      // Generate SRT if separate subtitles requested
      let srtPath: string | null = null
      if ((subtitleOption === 'srt' || subtitleOption === 'both') && subtitles.length > 0) {
        srtPath = path.join(outputDir, `subtitles_${Date.now()}.srt`)
        const srtContent = generateSRTContent(subtitles)
        await fs.writeFile(srtPath, srtContent, 'utf-8')
      }

      // Update export job as completed with file paths
      const completedJob = await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          progressMessage: 'Export completed',
          completedAt: new Date(),
          // API URLs for frontend
          videoUrl: `/api/export/${projectId}/${exportJob.id}/video`,
          srtUrl:
            subtitleOption === 'srt' || subtitleOption === 'both'
              ? `/api/export/${projectId}/${exportJob.id}/srt`
              : null,
          thumbnailUrl: exportThumbnail ? `/api/export/${projectId}/${exportJob.id}/thumbnail` : null,
          // Actual file paths for download
          videoPath: outputPath,
          srtPath: srtPath,
          thumbnailPath: thumbnailPath,
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

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETED', completedAt: new Date() },
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
      // Update export job as failed
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
    return NextResponse.json(
      { error: 'Failed to export video' },
      { status: 500 }
    )
  }
}

// GET /api/export/[projectId]/[jobId] - Get export job status
// Note: This route should be moved to a separate route file if needed
// Currently handled by the export POST endpoint which returns the job status
