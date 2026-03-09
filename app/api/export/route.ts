import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { exportVideo, generateSRTContent, generateThumbnail } from '@/lib/video-processor'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

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
      quality = '720p',
      format = 'mp4',
      subtitleOption = 'burned',
      removeWatermark = false,
      exportThumbnail = false,
    } = body

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
        subtitles: subtitleOption === 'burned' ? subtitles : [],
        burnSubtitles: subtitleOption === 'burned',
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
      if (subtitleOption === 'separate' && subtitles.length > 0) {
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
          srtUrl: subtitleOption === 'separate' ? `/api/export/${projectId}/${exportJob.id}/srt` : null,
          thumbnailUrl: exportThumbnail ? `/api/export/${projectId}/${exportJob.id}/thumbnail` : null,
          // Actual file paths for download
          videoPath: outputPath,
          srtPath: srtPath,
          thumbnailPath: thumbnailPath,
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
