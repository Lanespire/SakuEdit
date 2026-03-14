import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/db'
import { extractPersistedExportState } from '@/lib/rve-state'
import {
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'

const timelineMutationSchema = z.object({
  currentTime: z.number().min(0),
  zoomLevel: z.number().min(0.25).max(8),
  scrollPosition: z.number().min(0),
  isPlaying: z.boolean().optional(),
  compositionData: z.string().optional(),
})

async function assertOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    notFound('Project not found')
  }

  if (project.userId !== userId) {
    forbidden('Project not found')
  }
}

export const PATCH = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params
  const body = await parseJson(request, timelineMutationSchema)
  const persistedExportState = body.compositionData
    ? extractPersistedExportState(body.compositionData)
    : null

  await assertOwnedProject(projectId, userId)

  const writes: Prisma.PrismaPromise<unknown>[] = []

  if (body.compositionData !== undefined) {
    writes.push(prisma.project.update({
      where: { id: projectId },
      data: { compositionData: body.compositionData },
    }))

    if (persistedExportState) {
      writes.push(prisma.subtitle.deleteMany({
        where: { projectId },
      }))

      if (persistedExportState.subtitles.length > 0) {
        writes.push(prisma.subtitle.createMany({
          data: persistedExportState.subtitles.map((subtitle) => ({
            projectId,
            text: subtitle.text,
            startTime: subtitle.startTime,
            endTime: subtitle.endTime,
            position: subtitle.position,
            fontSize: subtitle.fontSize,
            fontColor: subtitle.fontColor,
            backgroundColor: subtitle.backgroundColor,
            isBold: subtitle.isBold,
            style: 'default',
          })),
        }))
      }
    }
  }

  writes.push(prisma.timeline.upsert({
    where: { projectId },
    update: {
      currentTime: body.currentTime,
      zoomLevel: body.zoomLevel,
      scrollPosition: body.scrollPosition,
      ...(body.isPlaying !== undefined ? { isPlaying: body.isPlaying } : {}),
    },
    create: {
      projectId,
      currentTime: body.currentTime,
      zoomLevel: body.zoomLevel,
      scrollPosition: body.scrollPosition,
      isPlaying: body.isPlaying ?? false,
    },
  }))

  const results = writes.length > 0 ? await prisma.$transaction(writes) : []
  const timeline = results.at(-1)

  return ok({ timeline })
}, { onError: 'Failed to save timeline state' })
