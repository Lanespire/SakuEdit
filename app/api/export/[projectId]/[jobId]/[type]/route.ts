import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// GET /api/export/[projectId]/[jobId]/[type] - Download export file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; jobId: string; type: string }> }
) {
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

    const { projectId, jobId, type } = await params

    const exportJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
      include: {
        project: true,
      },
    })

    if (!exportJob || exportJob.project.userId !== userId) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    if (exportJob.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Export not completed yet' },
        { status: 400 }
      )
    }

    const exportDir = path.join(UPLOAD_DIR, 'exports', projectId)

    let filePath: string | null
    let contentType: string
    let filename: string

    switch (type) {
      case 'video': {
        // Use stored file path if available, otherwise fall back to directory search
        filePath = exportJob.videoPath
        if (!filePath) {
          // Fallback: search for video file in export directory
          const files = await fs.readdir(exportDir)
          const videoFile = files.find(f => f.startsWith('output_') && f.endsWith(`.${exportJob.format || 'mp4'}`))
          if (videoFile) {
            filePath = path.join(exportDir, videoFile)
          }
        }
        const format = exportJob.format || 'mp4'
        contentType = format === 'mp4' ? 'video/mp4' : 'video/webm'
        filename = `sakuedit_export_${projectId}.${format}`
        break
      }
      case 'srt': {
        filePath = exportJob.srtPath
        if (!filePath) {
          const files = await fs.readdir(exportDir)
          const srtFile = files.find(f => f.startsWith('subtitles_') && f.endsWith('.srt'))
          if (srtFile) {
            filePath = path.join(exportDir, srtFile)
          }
        }
        contentType = 'text/plain'
        filename = `subtitles_${projectId}.srt`
        break
      }
      case 'thumbnail': {
        filePath = exportJob.thumbnailPath
        if (!filePath) {
          const files = await fs.readdir(exportDir)
          const thumbFile = files.find(f => f.startsWith('thumbnail_') && f.endsWith('.jpg'))
          if (thumbFile) {
            filePath = path.join(exportDir, thumbFile)
          }
        }
        contentType = 'image/jpeg'
        filename = `thumbnail_${projectId}.jpg`
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File path not found in job record' }, { status: 404 })
    }

    try {
      const file = await fs.readFile(filePath)

      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (fileError) {
      console.error('File not found:', filePath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
