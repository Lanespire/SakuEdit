import { NextRequest } from 'next/server'
import { ProjectStatus } from '@prisma/client'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  created,
  getRequiredUserId,
  handleRoute,
  ok,
  parseJson,
} from '@/lib/server/route'

const projectStatuses = new Set<string>(Object.values(ProjectStatus))

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  styleId: z.string().trim().min(1).nullable().optional(),
})

export const GET = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request, { allowTestUserId: true })
  const status = request.nextUrl.searchParams.get('status')
  const projectStatus =
    status && projectStatuses.has(status) ? (status as ProjectStatus) : undefined

  const projects = await prisma.project.findMany({
    where: {
      userId,
      ...(projectStatus && { status: projectStatus }),
    },
    include: {
      videos: true,
      style: true,
      _count: {
        select: { subtitles: true },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return ok({ projects })
}, { onError: 'Failed to fetch projects' })

export const POST = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request, { allowTestUserId: true })
  const body = await parseJson(request, createProjectSchema)

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name,
      styleId: body.styleId || null,
      status: 'UPLOADING',
    },
    include: {
      style: true,
    },
  })

  return created({ project })
}, { onError: 'Failed to create project' })
