import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getStylePreset } from '@/lib/style-presets'
import {
  badRequest,
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'

const applyPresetSchema = z.object({
  projectId: z.string().trim().min(1),
  presetId: z.string().trim().min(1),
})

export const POST = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request)
  const { projectId, presetId } = await parseJson(request, applyPresetSchema)

  const preset = getStylePreset(presetId)
  if (!preset) {
    badRequest('指定されたプリセットスタイルが見つかりません')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  })

  if (!project) {
    notFound('Project not found')
  }

  if (project.userId !== userId) {
    forbidden('Project not found')
  }

  let style = await prisma.style.findFirst({
    where: {
      category: 'preset',
      sourceChannel: `preset:${preset.id}`,
    },
  })

  if (!style) {
    style = await prisma.style.create({
      data: {
        userId: null,
        name: preset.name,
        description: preset.description,
        category: 'preset',
        isPublic: true,
        usageCount: 0,
        sourceChannel: `preset:${preset.id}`,
        cutSettings: preset.cutSettings,
        subtitleSettings: preset.subtitleSettings,
        bgmSettings: preset.bgmSettings,
        tempoSettings: preset.tempoSettings,
      },
    })
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: {
        styleId: style.id,
      },
    }),
    prisma.style.update({
      where: { id: style.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    }),
  ])

  return ok({
    success: true,
    style: {
      id: style.id,
      name: style.name,
    },
  })
}, { onError: 'Failed to apply preset style' })
