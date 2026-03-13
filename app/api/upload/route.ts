import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { enqueueProjectProcessing } from '@/lib/server/processing-jobs'
import { dispatchProcessingJobOrMarkFailure } from '@/lib/server/processing-dispatch'
import {
  uploadLocalStorageObject,
  writeProjectAsset,
} from '@/lib/server/project-storage'
import { downloadFromYouTube } from '@/lib/video-processor'
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ALLOWED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-matroska',
]

async function queueProcessing(
  projectId: string,
  userId: string,
  options?: Record<string, unknown>,
) {
  const { job, shouldInvoke } = await enqueueProjectProcessing({
    projectId,
    userId,
    options,
  })

  if (!shouldInvoke) {
    return
  }

  await dispatchProcessingJobOrMarkFailure({
    job,
    projectId,
  })
}

// POST /api/upload - Upload a video file
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

    let formData: FormData

    try {
      formData = await request.formData()
    } catch (error) {
      console.error('Failed to parse upload form data:', error)
      return NextResponse.json(
        {
          error:
            'アップロードデータを解析できませんでした。ファイルサイズまたは送信形式を確認してください。',
        },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const sourceType = (formData.get('sourceType') as string) || 'upload'
    const originalUrl = formData.get('url') as string | null
    const autoProcess = formData.get('autoProcess') !== 'false'

    // Handle URL-based upload (YouTube, TikTok)
    if (originalUrl && !file) {
      if (!projectId) {
        return NextResponse.json(
          { error: 'Project ID is required for URL uploads' },
          { status: 400 }
        )
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'UPLOADING',
          progress: 0,
          progressMessage: '動画を取得しています',
          lastError: null,
        },
      })

      const downloadResult = await downloadFromYouTube(originalUrl, projectId, 'input.mp4')
      if (!downloadResult.success || !downloadResult.inputPath) {
        throw new Error(downloadResult.error || 'Failed to download source video')
      }

      const storagePath = await uploadLocalStorageObject(
        `projects/${projectId}/input.mp4`,
        downloadResult.inputPath,
        {
          contentType: 'video/mp4',
        },
      )

      const video = await prisma.video.create({
        data: {
          projectId,
          sourceType,
          filename: `url-import-${Date.now()}.mp4`,
          originalUrl,
          storagePath,
          duration: downloadResult.metadata?.duration || 0,
          width: downloadResult.metadata?.width || null,
          height: downloadResult.metadata?.height || null,
          fileSize: (await fs.stat(downloadResult.inputPath)).size,
          mimeType: 'video/mp4',
        },
      })

      await fs.rm(path.dirname(downloadResult.inputPath), {
        recursive: true,
        force: true,
      }).catch(() => undefined)

      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: autoProcess ? 'QUEUED' : 'DRAFT',
          progress: 0,
          progressMessage: autoProcess ? '処理キューに追加しました' : 'スタイルを選択してください',
          lastError: null,
        },
      })

      if (autoProcess) {
        await queueProcessing(projectId, userId)
      }

      return NextResponse.json(
        { video, status: autoProcess ? 'processing' : 'uploaded' },
        { status: autoProcess ? 202 : 200 }
      )
    }

    // Handle file upload
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create project directory structure: uploads/projects/{projectId}/
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const inputPath = await writeProjectAsset(projectId, 'input.mp4', buffer, {
      contentType: file.type,
    })

    // Create video record
    const video = await prisma.video.create({
      data: {
        projectId,
        sourceType,
        filename: file.name,
        storagePath: inputPath, // source of truth
        duration: 0, // Will be updated after processing
        fileSize: file.size,
        mimeType: file.type,
      },
    })

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: autoProcess ? 'QUEUED' : 'DRAFT',
        progress: 0,
        progressMessage: autoProcess ? '処理キューに追加しました' : 'スタイルを選択してください',
        lastError: null,
      },
    })

    if (autoProcess) {
      await queueProcessing(projectId, userId)
    }

    return NextResponse.json({
      video,
      status: autoProcess ? 'processing' : 'uploaded',
      message: autoProcess
        ? 'Video uploaded successfully. Processing will begin shortly.'
        : 'Video uploaded successfully. Choose a style to continue.',
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload video' },
      { status: 500 }
    )
  }
}
