import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { RouteError, forbidden, getRequiredUserId, notFound } from '@/lib/server/route'

function createVideoResponseHeaders(
  mimeType: string,
  size: number,
  range?: { start: number; end: number },
) {
  const headers = new Headers({
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, max-age=0, must-revalidate',
  })

  if (range) {
    headers.set('Content-Length', String(range.end - range.start + 1))
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`)
  } else {
    headers.set('Content-Length', String(size))
  }

  return headers
}

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

    const fileStat = await stat(video.storagePath)
    const rangeHeader = request.headers.get('range')
    const mimeType = video.mimeType || 'video/mp4'

    if (!rangeHeader) {
      const stream = createReadStream(video.storagePath)
      return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        status: 200,
        headers: createVideoResponseHeaders(mimeType, fileStat.size),
      })
    }

    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
    if (!match) {
      return new NextResponse(null, {
        status: 416,
        headers: createVideoResponseHeaders(mimeType, fileStat.size),
      })
    }

    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : fileStat.size - 1
    const safeEnd = Math.min(end, fileStat.size - 1)

    if (!Number.isFinite(start) || start < 0 || start > safeEnd) {
      return new NextResponse(null, {
        status: 416,
        headers: createVideoResponseHeaders(mimeType, fileStat.size),
      })
    }

    const stream = createReadStream(video.storagePath, { start, end: safeEnd })
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: createVideoResponseHeaders(mimeType, fileStat.size, { start, end: safeEnd }),
    })
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(error.payload, { status: error.status })
    }

    console.error('Failed to stream source video:', error)
    return NextResponse.json({ error: 'Failed to stream source video' }, { status: 500 })
  }
}
