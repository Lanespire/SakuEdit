import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
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

  await assertOwnedProject(projectId, userId)

  if (body.compositionData !== undefined) {
    await prisma.project.update({
      where: { id: projectId },
      data: { compositionData: body.compositionData },
    })
  }

  const timeline = await prisma.timeline.upsert({
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
  })

  return ok({ timeline })
}, { onError: 'Failed to save timeline state' })
