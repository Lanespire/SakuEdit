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
import { generateCompositionPatches } from '@/lib/ai-composition-chat'
import { generateOverlayOperations } from '@/lib/ai-overlay-chat'

// Support both legacy CompositionData and RVE overlay formats
const chatBodySchema = z.object({
  message: z.string().min(1),
  // Legacy format
  compositionData: z.record(z.string(), z.unknown()).optional(),
  // RVE overlay format
  overlays: z.array(z.record(z.string(), z.unknown())).optional(),
  aspectRatio: z.string().optional(),
  fps: z.number().optional(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
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

export const POST = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId } = await params
  await assertOwnedProject(projectId, userId)

  const body = await parseJson(request, chatBodySchema)

  // RVE overlay mode (preferred)
  if (body.overlays) {
    const result = await generateOverlayOperations({
      userMessage: body.message,
      overlays: body.overlays as import('@/app/reactvideoeditor/pro/types').Overlay[],
      fps: body.fps,
      aspectRatio: body.aspectRatio,
      chatHistory: body.chatHistory ?? [],
    })

    return ok({ projectId, ...result })
  }

  // Legacy CompositionData mode (backwards compatible)
  if (body.compositionData) {
    const result = await generateCompositionPatches({
      userMessage: body.message,
      currentData: body.compositionData as import('@/lib/composition-data').CompositionData,
      chatHistory: body.chatHistory ?? [],
    })

    return ok({ projectId, ...result })
  }

  // No data provided - just respond conversationally
  const result = await generateOverlayOperations({
    userMessage: body.message,
    overlays: [],
    chatHistory: body.chatHistory ?? [],
  })

  return ok({ projectId, ...result })
}, { onError: 'Failed to process chat message' })
