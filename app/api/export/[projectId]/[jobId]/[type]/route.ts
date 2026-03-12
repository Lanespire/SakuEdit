import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { createVideoBucketSignedGetUrl } from '@/lib/server/video-bucket'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; jobId: string; type: string }> },
) {
  try {
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

    if (!exportJob || exportJob.projectId !== projectId || exportJob.project.userId !== userId) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    if (exportJob.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Export not completed yet' }, { status: 400 })
    }

    let objectKey: string | null = null
    let fileName: string
    let contentType: string

    switch (type) {
      case 'video':
        objectKey = exportJob.videoPath
        fileName = `sakuedit_export_${projectId}.${exportJob.format || 'mp4'}`
        contentType = exportJob.format === 'webm' ? 'video/webm' : exportJob.format === 'mov' ? 'video/quicktime' : 'video/mp4'
        break
      case 'srt':
        objectKey = exportJob.srtPath
        fileName = `subtitles_${projectId}.srt`
        contentType = 'text/plain; charset=utf-8'
        break
      case 'thumbnail':
        objectKey = exportJob.thumbnailPath
        fileName = `thumbnail_${projectId}.jpg`
        contentType = 'image/jpeg'
        break
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (!objectKey) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    const signedUrl = await createVideoBucketSignedGetUrl(objectKey, {
      fileName,
      contentType,
    })

    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }
}
