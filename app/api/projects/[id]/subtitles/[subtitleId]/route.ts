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

const subtitleMutationSchema = z.object({
  text: z.string().trim().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  style: z.enum(['default', 'youtuber', 'minimal', 'bold', 'outline']).default('default'),
  position: z.string().trim().min(1).default('bottom'),
  fontSize: z.number().int().min(12).max(128).default(24),
  fontColor: z.string().trim().min(4).default('#FFFFFF'),
  backgroundColor: z.string().trim().min(4).nullable().optional(),
  isBold: z.boolean().default(false),
})

async function assertOwnedSubtitle(projectId: string, subtitleId: string, userId: string) {
  const subtitle = await prisma.subtitle.findUnique({
    where: { id: subtitleId },
    include: {
      project: true,
    },
  })

  if (!subtitle || subtitle.projectId !== projectId) {
    notFound('Subtitle not found')
  }

  if (subtitle.project.userId !== userId) {
    forbidden('Subtitle not found')
  }

  return subtitle
}

export const PATCH = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtitleId: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId, subtitleId } = await params
  const body = await parseJson(request, subtitleMutationSchema)

  await assertOwnedSubtitle(projectId, subtitleId, userId)

  const subtitle = await prisma.subtitle.update({
    where: { id: subtitleId },
    data: body,
  })

  return ok({ subtitle })
}, { onError: 'Failed to update subtitle' })

export const DELETE = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtitleId: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId, subtitleId } = await params

  await assertOwnedSubtitle(projectId, subtitleId, userId)
  await prisma.subtitle.delete({
    where: { id: subtitleId },
  })

  return ok({ success: true })
}, { onError: 'Failed to delete subtitle' })
