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

const markerSchema = z.object({
  id: z.string().trim().min(1).optional(),
  time: z.number().min(0),
  type: z.string().trim().min(1),
  label: z.string().trim().min(1).nullable().optional(),
  color: z.string().trim().min(4).default('#f97415'),
})

const markersMutationSchema = z.object({
  markers: z.array(markerSchema),
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

export const PUT = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params
  const body = await parseJson(request, markersMutationSchema)

  await assertOwnedProject(projectId, userId)

  await prisma.$transaction([
    prisma.marker.deleteMany({
      where: { projectId },
    }),
    prisma.marker.createMany({
      data: body.markers.map((marker) => ({
        projectId,
        time: marker.time,
        type: marker.type,
        label: marker.label ?? null,
        color: marker.color,
      })),
    }),
  ])

  const markers = await prisma.marker.findMany({
    where: { projectId },
    orderBy: {
      time: 'asc',
    },
  })

  return ok({ markers })
}, { onError: 'Failed to update markers' })
