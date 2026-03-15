import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  created,
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

export const GET = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request, { allowTestUserId: true })
  const { id: projectId } = await params
  await assertOwnedProject(projectId, userId)

  const subtitles = await prisma.subtitle.findMany({
    where: { projectId },
    orderBy: { startTime: 'asc' },
  })

  return ok({ subtitles })
}, { onError: 'Failed to fetch subtitles' })

export const POST = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request, { allowTestUserId: true })
  const { id: projectId } = await params
  const body = await parseJson(request, subtitleMutationSchema)

  await assertOwnedProject(projectId, userId)

  const subtitle = await prisma.subtitle.create({
    data: {
      projectId,
      ...body,
    },
  })

  return created({ subtitle })
}, { onError: 'Failed to create subtitle' })
