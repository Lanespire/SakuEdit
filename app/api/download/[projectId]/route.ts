import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import {
  buildProcessingArtifactObjectKey,
  resolveProjectAssetUrl,
} from '@/lib/server/project-storage'
import {
  getLatestCompletedProcessingJob,
  PROCESSING_PIPELINE_VERSION,
} from '@/lib/server/processing-jobs'

// GET /api/download/[projectId]?type=video|srt|thumbnail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'video'

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: true,
        exportJobs: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const latestProcessingJob = await getLatestCompletedProcessingJob(projectId)
    const artifactPipelineVersion =
      latestProcessingJob?.pipelineVersion || PROCESSING_PIPELINE_VERSION

    let filePath: string
    let contentType: string
    let filename: string

    switch (type) {
      case 'video': {
        const latestExport = project.exportJobs[0]
        filePath =
          latestExport?.videoUrl ||
          latestProcessingJob?.outputVideoPath ||
          buildProcessingArtifactObjectKey(projectId, artifactPipelineVersion, 'output.mp4')
        contentType = 'video/mp4'
        filename = `${project.name}.mp4`
        break
      }
      case 'srt': {
        const latestExport = project.exportJobs[0]
        filePath =
          latestExport?.srtUrl ||
          latestProcessingJob?.srtPath ||
          buildProcessingArtifactObjectKey(projectId, artifactPipelineVersion, 'subtitles.srt')
        contentType = 'text/plain; charset=utf-8'
        filename = `${project.name}.srt`
        break
      }
      case 'thumbnail': {
        filePath =
          latestProcessingJob?.thumbnailPath ||
          buildProcessingArtifactObjectKey(projectId, artifactPipelineVersion, 'thumbnail.jpg')
        contentType = 'image/jpeg'
        filename = `${project.name}-thumbnail.jpg`
        break
      }
      default:
        return NextResponse.json(
          { error: 'Invalid download type' },
          { status: 400 }
        )
    }

    if (filePath.startsWith('/api/')) {
      return NextResponse.redirect(new URL(filePath, request.url))
    }

    const signedUrl = await resolveProjectAssetUrl(filePath, {
      fileName: filename,
      contentType,
    })

    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
