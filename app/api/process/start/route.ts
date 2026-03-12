import { after, NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'
import { z } from 'zod'

const startProcessingSchema = z.object({
  projectId: z.string().trim().min(1),
  options: z.record(z.string(), z.unknown()).optional(),
})

async function updateProjectProcessingError(projectId: string, message: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'ERROR',
      progressMessage: '処理の開始に失敗しました',
      lastError: message,
    },
  })
}

export const POST = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request)
  const body = await parseJson(request, startProcessingSchema)

  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    select: { id: true, userId: true },
  })

  if (!project) {
    notFound('Project not found')
  }

  if (project.userId !== userId) {
    forbidden('Project not found')
  }

  await prisma.project.update({
    where: { id: body.projectId },
    data: {
      status: 'QUEUED',
      progress: 0,
      progressMessage: '処理キューに追加しました',
      lastError: null,
    },
  })

  after(async () => {
    try {
      const response = await fetch(new URL('/api/process', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const responseText = await response.text()
        const errorMessage = responseText || `status ${response.status}`
        console.error('Background processing startup failed:', errorMessage)
        await updateProjectProcessingError(
          body.projectId,
          `Processing startup failed: ${errorMessage}`,
        )
      }
    } catch (error) {
      console.error('Background processing request failed:', error)
      await updateProjectProcessingError(
        body.projectId,
        `Processing startup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  })

  return ok({ success: true, status: 'queued' }, { status: 202 })
}, { onError: 'Failed to start processing' })
