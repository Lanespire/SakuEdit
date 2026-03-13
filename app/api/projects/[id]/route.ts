import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getBillingSnapshot } from '@/lib/billing'
import { pickDefined } from '@/lib/server/object'
import {
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  progressMessage: z.string().optional(),
  styleId: z.string().nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  canceledAt: z.coerce.date().nullable().optional(),
  lastError: z.string().nullable().optional(),
})

async function getOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    notFound('Project not found')
  }

  if (project.userId !== userId) {
    forbidden('Project not found')
  }

  return project
}

export const GET = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId,
    },
    include: {
      videos: true,
      subtitles: {
        orderBy: { startTime: 'asc' },
      },
      style: true,
      aiSuggestions: {
        orderBy: { priority: 'desc' },
      },
      timeline: {
        include: {
          tracks: {
            include: {
              clips: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      markers: {
        orderBy: { time: 'asc' },
      },
      thumbnails: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) {
    notFound('Project not found')
  }

  const billing = await getBillingSnapshot(userId)

  return ok({
    project,
    billing: {
      planId: billing.plan.id,
      remainingSeconds: billing.remainingSeconds,
      usedSeconds: billing.usedSeconds,
    },
  })
}, { onError: 'Failed to fetch project' })

export const PATCH = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params
  const body = await parseJson(request, updateProjectSchema)

  const currentProject = await getOwnedProject(projectId, userId)

  const updateData = pickDefined(body, [
    'name',
    'status',
    'progress',
    'progressMessage',
    'styleId',
    'startedAt',
    'completedAt',
    'canceledAt',
    'lastError',
  ]) as Prisma.ProjectUpdateInput

  if (body.status === 'DRAFT' && currentProject.status !== 'DRAFT') {
    delete updateData.status
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      videos: true,
      style: true,
    },
  })

  return ok({ project })
}, { onError: 'Failed to update project' })

export const DELETE = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params

  await getOwnedProject(projectId, userId)
  await prisma.project.delete({
    where: { id: projectId },
  })

  return ok({ success: true })
}, { onError: 'Failed to delete project' })
