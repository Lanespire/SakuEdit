import { NextRequest } from 'next/server'
import { analyzeStyle, analyzeVisualStyle, transcribeAudio, generateSubtitles } from '@/lib/ai'
import { downloadFromYouTube, extractAudio, sampleVideoForStyleAnalysis } from '@/lib/video-processor'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import {
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'

const youtubeUrlSchema = z
  .url()
  .refine(
    (value) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(value),
    'Only YouTube URLs are supported for style analysis',
  )

const analyzeRequestSchema = z.object({
  projectId: z.string().trim().min(1).optional(),
  referenceUrl: youtubeUrlSchema,
})

export const POST = handleRoute(async (request: NextRequest) => {
  const analysisWindowSeconds = 90
  const userId = await getRequiredUserId(request)

  const { projectId, referenceUrl } = await parseJson(request, analyzeRequestSchema)
  const isTemporaryProject = !projectId

  const project = projectId
    ? await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          videos: true,
        },
      })
    : await prisma.project.create({
        data: {
          userId,
          name: 'Style learning scratch',
          status: 'ANALYZING',
          progress: 0,
          progressMessage: 'Style analysis in progress',
        },
        include: {
          videos: true,
        },
      })

  if (!project) {
    notFound('Project not found')
  }

  if (project.userId !== userId) {
    forbidden('Project not found')
  }

  const downloadResult = await downloadFromYouTube(
    referenceUrl,
    `${project.id}-reference`,
    'reference.mp4',
  )

  if (!downloadResult.success || !downloadResult.inputPath) {
    throw new Error(downloadResult.error || 'Failed to download reference video')
  }

  const audioPath = downloadResult.inputPath.replace('.mp4', '.wav')
  const extractResult = await extractAudio(
    downloadResult.inputPath,
    audioPath,
    16000,
    analysisWindowSeconds,
  )

  if (!extractResult.success || !extractResult.outputPath) {
    throw new Error(extractResult.error || 'Failed to extract audio')
  }

  let transcript = ''
  let segments: Array<{ start: number; end: number; text: string }> = []

  try {
    const asrResult = await transcribeAudio(extractResult.outputPath, 'ja')
    transcript = asrResult.text
    segments = asrResult.segments
  } catch (error) {
    throw new Error(
      `Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  const metadata = {
    title: 'Reference Video',
    description: '',
    duration: downloadResult.metadata?.duration,
    channelName: '',
  }

  let visualProfile
  try {
    const styleSample = await sampleVideoForStyleAnalysis(
      downloadResult.inputPath,
      `${project.id}-reference`,
      {
        analysisDuration: analysisWindowSeconds,
        maxFrames: 8,
        sceneThreshold: 0.32,
      },
    )
    visualProfile = await analyzeVisualStyle(styleSample, metadata)
  } catch (error) {
    throw new Error(
      `Visual style analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  let styleAnalysis
  try {
    styleAnalysis = await analyzeStyle(transcript, metadata, visualProfile)
  } catch (error) {
    throw new Error(
      `Style analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

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
      visualProfile: styleAnalysis.visualProfile as Prisma.InputJsonValue,
    },
  })

  if (!isTemporaryProject) {
    await prisma.analysisJob.create({
      data: {
        projectId: project.id,
        status: 'COMPLETED',
        progress: 100,
        progressMessage: 'Style analysis completed',
        referenceUrl,
        result: styleAnalysis as Prisma.InputJsonValue,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    await prisma.project.update({
      where: { id: project.id },
      data: { styleId: style.id },
    })

    const subtitles = await generateSubtitles(
      transcript,
      segments,
      styleAnalysis.subtitleSettings,
    )

    await prisma.subtitle.createMany({
      data: subtitles.map((sub) => ({
        projectId: project.id,
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
  } else {
    await prisma.project.delete({
      where: { id: project.id },
    })
  }

  return ok({
    success: true,
    projectId: project.id,
    styleId: style.id,
    analysis: styleAnalysis,
    message: 'Style analysis completed',
  })
}, { onError: 'Failed to analyze style' })
