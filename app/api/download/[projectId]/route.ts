import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

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

    // プロジェクトの所有権を確認
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

    // プロジェクトディレクトリ
    const projectDir = path.join(UPLOAD_DIR, 'projects', projectId)

    // タイプに応じたファイルパスを決定
    let filePath: string
    let contentType: string
    let filename: string

    switch (type) {
      case 'video': {
        // ExportJobから最新のvideoUrlを取得
        const latestExport = project.exportJobs[0]
        if (latestExport?.videoUrl) {
          filePath = latestExport.videoUrl
        } else {
          // フォールバック: output.mp4
          filePath = path.join(projectDir, 'output.mp4')
        }
        contentType = 'video/mp4'
        filename = `${project.name}.mp4`
        break
      }

      case 'srt': {
        const latestExport = project.exportJobs[0]
        if (latestExport?.srtUrl) {
          filePath = latestExport.srtUrl
        } else {
          // フォールバック: subtitles.srt
          filePath = path.join(projectDir, 'subtitles.srt')
        }
        contentType = 'text/plain; charset=utf-8'
        filename = `${project.name}.srt`
        break
      }

      case 'thumbnail': {
        const video = project.videos[0]
        if (video?.thumbnailUrl) {
          filePath = video.thumbnailUrl
        } else {
          // フォールバック: thumbnail.jpg
          filePath = path.join(projectDir, 'thumbnail.jpg')
        }
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

    // ファイルの存在確認
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'File not found', type, filePath },
        { status: 404 }
      )
    }

    // ファイルを読み込んで返す
    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=31536000', // 1年間キャッシュ
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}
