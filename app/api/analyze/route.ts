import { NextRequest, NextResponse } from 'next/server'
import { analyzeStyle, analyzeVisualStyle, transcribeAudio, generateSubtitles } from '@/lib/ai'
import { downloadFromYouTube, extractAudio, sampleVideoForStyleAnalysis } from '@/lib/video-processor'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Analyze video editing style from a reference URL
 * This downloads the reference video and analyzes its actual content
 */
export async function POST(request: NextRequest) {
  const analysisWindowSeconds = 90

  try {
    const body = await request.json()
    const { projectId, referenceUrl } = body

    if (!projectId || !referenceUrl) {
      return NextResponse.json(
        { error: 'Project ID and reference URL are required' },
        { status: 400 }
      )
    }

    // YouTube URLの検証
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(referenceUrl)) {
      return NextResponse.json(
        { error: 'Only YouTube URLs are supported for style analysis' },
        { status: 400 }
      )
    }

    // プロジェクトを取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        videos: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // 参考動画をダウンロード
    const downloadResult = await downloadFromYouTube(
      referenceUrl,
      `${projectId}-reference`,
      'reference.mp4'
    )

    if (!downloadResult.success || !downloadResult.inputPath) {
      return NextResponse.json(
        { error: downloadResult.error || 'Failed to download reference video' },
        { status: 500 }
      )
    }

    // 音声を抽出
    const audioPath = downloadResult.inputPath.replace('.mp4', '.wav')
    const extractResult = await extractAudio(
      downloadResult.inputPath,
      audioPath,
      16000,
      analysisWindowSeconds
    )

    if (!extractResult.success || !extractResult.outputPath) {
      return NextResponse.json(
        { error: extractResult.error || 'Failed to extract audio' },
        { status: 500 }
      )
    }

    // 文字起こし（ASR）
    let transcript = ''
    let segments: Array<{ start: number; end: number; text: string }> = []

    try {
      const asrResult = await transcribeAudio(extractResult.outputPath, 'ja')
      transcript = asrResult.text
      segments = asrResult.segments
    } catch (error) {
      // ASR失敗時はエラーを返す（ダミーデータを返さない）
      console.error('ASR failed:', error)
      return NextResponse.json(
        { error: `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // メタデータを抽出（yt-dlpから取得したものを使う）
    const metadata = {
      title: 'Reference Video', // yt-dlpからタイトルを取得できるように拡張可能
      description: '',
      duration: downloadResult.metadata?.duration,
      channelName: '',
    }

    let visualProfile
    try {
      const styleSample = await sampleVideoForStyleAnalysis(
        downloadResult.inputPath,
        `${projectId}-reference`,
        {
          analysisDuration: analysisWindowSeconds,
          maxFrames: 8,
          sceneThreshold: 0.32,
        }
      )
      visualProfile = await analyzeVisualStyle(styleSample, metadata)
    } catch (error) {
      console.error('Visual style analysis failed:', error)
      return NextResponse.json(
        { error: `Visual style analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // スタイル分析を実行
    let styleAnalysis
    try {
      styleAnalysis = await analyzeStyle(transcript, metadata, visualProfile)
    } catch (error) {
      console.error('Style analysis failed:', error)
      return NextResponse.json(
        { error: `Style analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // 分析結果をDBに保存（Styleレコード）
    const style = await prisma.style.create({
      data: {
        userId: project.userId,
        name: `Learned from ${new URL(referenceUrl).hostname}`,
        description: `Style learned from reference video at ${referenceUrl}`,
        category: 'learned',
        isPublic: false,
        usageCount: 0,
        referenceUrl,
        cutSettings: styleAnalysis.cutSettings,
        subtitleSettings: styleAnalysis.subtitleSettings,
        bgmSettings: styleAnalysis.bgmSettings,
        tempoSettings: styleAnalysis.tempoSettings,
      },
    })

    // 分析ジョブを記録
    await prisma.analysisJob.create({
      data: {
        projectId,
        status: 'COMPLETED',
        progress: 100,
        progressMessage: 'Style analysis completed',
        referenceUrl,
        result: styleAnalysis as Prisma.InputJsonValue,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    // プロジェクトにスタイルを紐付け
    await prisma.project.update({
      where: { id: projectId },
      data: { styleId: style.id },
    })

    // 字幕を生成
    const subtitles = await generateSubtitles(
      transcript,
      segments,
      styleAnalysis.subtitleSettings
    )

    // 字幕をDBに保存
    await prisma.subtitle.createMany({
      data: subtitles.map((sub) => ({
        projectId,
        startTime: sub.start,
        endTime: sub.end,
        text: sub.text,
        style: 'default',
        position: styleAnalysis.subtitleSettings.position,
        fontSize: styleAnalysis.subtitleSettings.size,
        fontColor: styleAnalysis.subtitleSettings.color,
        backgroundColor: styleAnalysis.subtitleSettings.backgroundColor,
        isBold: false,
      })),
    })

    // 分析結果を返す
    return NextResponse.json({
      success: true,
      projectId,
      styleId: style.id,
      analysis: styleAnalysis,
      subtitles,
      message: 'Style analysis completed',
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: `Failed to analyze style: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
