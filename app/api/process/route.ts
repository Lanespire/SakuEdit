import { NextRequest, NextResponse } from 'next/server'
import { processVideo, detectSilence, extractAudio, getVideoDuration, generateThumbnail, generateWaveformData } from '@/lib/video-processor'
import { transcribeAudio, generateSubtitles, generateSRT } from '@/lib/ai'
import { prisma } from '@/lib/db'
import path from 'path'
import fs from 'fs/promises'

/**
 * Process video: extract audio, transcribe, cut silence, generate output
 */
export async function POST(request: NextRequest) {
  let projectId: string | undefined
  try {
    const body = await request.json()
    projectId = body.projectId
    const { options } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // TypeScript type guard - projectId is now guaranteed to be a string
    const validProjectId: string = projectId

    // プロジェクトを取得
    const project = await prisma.project.findUnique({
      where: { id: validProjectId },
      include: {
        videos: true,
        style: true,
        subtitles: true,
      },
    })

    if (!project || !project.videos[0]) {
      return NextResponse.json(
        { error: 'Project or video not found' },
        { status: 404 }
      )
    }

    const video = project.videos[0]
    const inputPath = video.storagePath

    if (!inputPath) {
      return NextResponse.json(
        { error: 'Video file path not found' },
        { status: 404 }
      )
    }

    // 入力ファイルの存在確認
    try {
      await fs.access(inputPath)
    } catch {
      return NextResponse.json(
        { error: 'Input video not found' },
        { status: 404 }
      )
    }

    // プロジェクトディレクトリの設定
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const projectDir = path.join(uploadDir, 'projects', projectId)
    await fs.mkdir(projectDir, { recursive: true })

    const audioPath = path.join(projectDir, 'source-audio.wav')
    const srtPath = path.join(projectDir, 'subtitles.srt')
    const thumbnailPath = path.join(projectDir, 'thumbnail.jpg')
    const outputPath = path.join(projectDir, 'output.mp4')

    // スタイル設定を取得（プロジェクトに紐づけられたスタイルまたはデフォルト）
    const styleSettings = project.style
      ? {
          cutSettings: project.style.cutSettings as any,
          subtitleSettings: project.style.subtitleSettings as any,
          bgmSettings: project.style.bgmSettings as any,
          tempoSettings: project.style.tempoSettings as any,
        }
      : {
          cutSettings: {
            minSilence: 0.3,
            aggressiveness: 'medium' as const,
            targetCutsPerMinute: 15,
          },
          subtitleSettings: {
            font: 'Noto Sans JP',
            size: 24,
            position: 'bottom' as const,
            color: '#FFFFFF',
            backgroundColor: '#00000080',
          },
          bgmSettings: {
            genre: 'upbeat',
            volume: 0.3,
            tempo: 'medium',
          },
          tempoSettings: {
            minClipDuration: 2,
            maxClipDuration: 10,
          },
        }

    // プロジェクト状態を更新：処理開始
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PROCESSING',
        progress: 0,
        progressMessage: 'Extracting audio...',
        startedAt: new Date(),
      },
    })

    // ステップ1: 音声抽出
    const extractResult = await extractAudio(inputPath, audioPath, 16000)
    if (!extractResult.success || !extractResult.outputPath) {
      await updateProjectError(projectId, `Audio extraction failed: ${extractResult.error}`)
      return NextResponse.json(
        { error: extractResult.error || 'Failed to extract audio' },
        { status: 500 }
      )
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 20, progressMessage: 'Transcribing audio...' },
    })

    // ステップ2: 文字起こし（ASR）
    let asrResult
    try {
      asrResult = await transcribeAudio(audioPath, 'ja')
    } catch (error) {
      await updateProjectError(projectId, `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return NextResponse.json(
        { error: `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 40, progressMessage: 'Generating subtitles...' },
    })

    // ステップ3: 字幕生成（ASRのセグメントを使用）
    const subtitles = await generateSubtitles(
      asrResult.text,
      asrResult.segments,
      styleSettings.subtitleSettings
    )

    // 字幕をDBに保存
    // 既存の字幕を削除してから再作成
    await prisma.subtitle.deleteMany({ where: { projectId: projectId! } })
    await prisma.subtitle.createMany({
      data: subtitles.map((sub) => ({
        projectId: projectId!,
        startTime: sub.start,
        endTime: sub.end,
        text: sub.text,
        style: 'default',
        position: styleSettings.subtitleSettings.position,
        fontSize: styleSettings.subtitleSettings.size,
        fontColor: styleSettings.subtitleSettings.color,
        backgroundColor: styleSettings.subtitleSettings.backgroundColor,
        isBold: false,
      })),
    })

    // SRTファイルを生成
    const srtContent = generateSRT(subtitles)
    await fs.writeFile(srtPath, srtContent, 'utf-8')

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 60, progressMessage: 'Detecting silence...' },
    })

    // ステップ4: 無音検出
    const silenceRegions = await detectSilence(
      inputPath,
      styleSettings.cutSettings.minSilence ?? -35,
      0.5
    )

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 80, progressMessage: 'Processing video...' },
    })

    // ステップ5: 動画処理（無音カット + 字幕バーンイン）
    const quality = options?.quality ?? '1080p'
    const result = await processVideo({
      inputPath,
      outputPath,
      silenceThreshold: styleSettings.cutSettings.minSilence ?? -35,
      silenceDuration: 0.5,
      subtitles: subtitles.map((sub) => ({
        text: sub.text,
        startTime: sub.start,
        endTime: sub.end,
        style: 'default',
      })),
      quality,
      format: 'mp4',
      watermark: options?.watermark ?? false,
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 90, progressMessage: 'Generating thumbnail...' },
    })

    // ステップ6: サムネイル生成
    await generateThumbnail(
      outputPath,
      thumbnailPath,
      1, // 1秒目
      1280,
      720
    )

    // ステップ7: 波形データ生成
    const waveformData = await generateWaveformData(outputPath, 100)

    // ステップ8: 動画メタデータを更新
    await prisma.video.update({
      where: { id: video.id },
      data: {
        silenceDetected: silenceRegions as any,
        waveform: waveformData.data as any,
      },
    })

    // プロジェクト状態を更新：完了
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        progressMessage: 'Processing completed',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      projectId,
      outputPath: `/api/download/${projectId}`,
      silenceRegions,
      duration: result.duration,
      subtitles,
      thumbnailUrl: `/api/thumbnail/${projectId}`,
    })
  } catch (error) {
    console.error('Processing error:', error)
    if (projectId) {
      await updateProjectError(projectId, `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

/**
 * Update project error status
 */
async function updateProjectError(projectId: string, errorMessage: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'ERROR',
      lastError: errorMessage,
    },
  })
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

  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  const projectDir = path.join(uploadDir, 'projects', projectId)
  const inputPath = path.join(projectDir, 'input.mp4')

  try {
    // プロジェクト情報を取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: true,
        subtitles: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'silence': {
        const videoPath = project.videos[0]?.storagePath || inputPath
        const regions = await detectSilence(videoPath)
        return NextResponse.json({ regions })
      }
      case 'duration': {
        const videoPath = project.videos[0]?.storagePath || inputPath
        const duration = await getVideoDuration(videoPath)
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
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
