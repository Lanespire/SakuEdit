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

const suggestionMutationSchema = z.object({
  isApplied: z.boolean(),
})

async function assertOwnedSuggestion(projectId: string, suggestionId: string, userId: string) {
  const suggestion = await prisma.aISuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      project: true,
    },
  })

  if (!suggestion || suggestion.projectId !== projectId) {
    notFound('Suggestion not found')
  }

  if (suggestion.project.userId !== userId) {
    forbidden('Suggestion not found')
  }
}

export const PATCH = handleRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) => {
  const userId = await getRequiredUserId(request)
  const { id: projectId, suggestionId } = await params
  const body = await parseJson(request, suggestionMutationSchema)

  await assertOwnedSuggestion(projectId, suggestionId, userId)

  const suggestion = await prisma.aISuggestion.update({
    where: { id: suggestionId },
    data: {
      isApplied: body.isApplied,
    },
  })

  return ok({ suggestion })
}, { onError: 'Failed to update AI suggestion' })
