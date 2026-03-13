import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { resolveProjectAssetUrl } from '@/lib/server/project-storage'
import { RouteError, forbidden, getRequiredUserId, notFound } from '@/lib/server/route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getRequiredUserId(request)
    const { id: projectId } = await params
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!project) {
      notFound('Project not found')
    }

    if (project.userId !== userId) {
      forbidden('Project not found')
    }

    const video = project.videos[0]
    if (!video?.storagePath) {
      return NextResponse.json({ error: 'Source video not found' }, { status: 404 })
    }

    const signedUrl = await resolveProjectAssetUrl(video.storagePath, {
      expiresInSeconds: 60 * 60,
      contentType: video.mimeType || 'video/mp4',
    })

    return NextResponse.redirect(signedUrl)
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(error.payload, { status: error.status })
    }

    console.error('Failed to stream source video:', error)
    return NextResponse.json({ error: 'Failed to stream source video' }, { status: 500 })
  }
}
