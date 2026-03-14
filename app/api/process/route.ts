import { NextRequest, NextResponse } from 'next/server'
import { detectSilence, getVideoDuration } from '@/lib/video-processor'
import { prisma } from '@/lib/db'
import fs from 'node:fs/promises'
import {
  buildProjectWorkingDir,
  getProjectAssetStoragePath,
  materializeProjectAsset,
} from '@/lib/server/project-storage'
import {
  enqueueProjectProcessing,
} from '@/lib/server/processing-jobs'
import { getRequiredUserId, RouteError } from '@/lib/server/route'
import { dispatchProcessingJobOrMarkFailure } from '@/lib/server/processing-dispatch'

async function withMaterializedVideo<T>(
  projectId: string,
  storagePath: string,
  run: (videoPath: string) => Promise<T>
) {
  const tempDir = buildProjectWorkingDir(projectId, 'inspect')

  try {
    const videoPath = await materializeProjectAsset(storagePath, {
      projectId,
      fileName: 'input.mp4',
      workDir: tempDir,
    })
    return await run(videoPath)
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

/**
 * Process video: extract audio, transcribe, cut silence, generate output
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getRequiredUserId(request)
    const body = await request.json()
    const projectId = body.projectId

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const result = await enqueueProjectProcessing({
      projectId,
      userId,
      options: body.options,
    })

    if (result.shouldInvoke) {
      await dispatchProcessingJobOrMarkFailure({
        job: result.job,
        projectId,
      })
    }

    return NextResponse.json({
      success: true,
      jobId: result.job.id,
      status: result.shouldInvoke ? 'queued' : result.job.status.toLowerCase(),
    }, { status: 202 })
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(error.payload, { status: error.status })
    }
    console.error('Process error:', error)
    const message = process.env.NODE_ENV === 'production'
      ? '処理中にエラーが発生しました'
      : `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const action = searchParams.get('action')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  const inputPath = getProjectAssetStoragePath(projectId, 'input.mp4')

  try {
    const userId = await getRequiredUserId(request)
    // プロジェクト情報を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: true,
        subtitles: true,
      },
    })

    if (!project || project.userId !== userId) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'silence': {
        const regions = await withMaterializedVideo(
          projectId,
          project.videos[0]?.storagePath || inputPath,
          (videoPath) => detectSilence(videoPath)
        )
        return NextResponse.json({ regions })
      }
      case 'duration': {
        const duration = await withMaterializedVideo(
          projectId,
          project.videos[0]?.storagePath || inputPath,
          (videoPath) => getVideoDuration(videoPath)
        )
        return NextResponse.json({ duration })
      }
      case 'subtitles': {
        return NextResponse.json({ subtitles: project.subtitles })
      }
      case 'status': {
        return NextResponse.json({
          status: project.status,
          progress: project.progress,
          progressMessage: project.progressMessage,
        })
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof RouteError) {
      return NextResponse.json(error.payload, { status: error.status })
    }
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
