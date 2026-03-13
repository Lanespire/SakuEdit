import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  badRequest,
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
  paymentRequired,
} from '@/lib/server/route'
import { generateMultipleThumbnails } from '@/lib/ai-thumbnail'
import { getBillingSnapshot } from '@/lib/billing'
import crypto from 'crypto'

const generateSchema = z.object({
  projectId: z.string().min(1),
  mode: z.enum(['TEMPLATE', 'UPLOAD', 'VIDEO_FRAME', 'REFERENCE']),
  prompt: z.string().min(1).max(500),
  templateId: z.string().optional(),
  uploadedImages: z.array(z.string()).max(5).optional(),
  frameTimestamps: z.array(z.number()).max(10).optional(),
  referenceUrl: z.string().url().optional(),
  referenceImages: z.array(z.string()).max(5).optional(),
  options: z
    .object({
      aspectRatio: z.enum(['16:9', '4:3']).optional(),
      textPosition: z.enum(['left', 'center', 'right']).optional(),
      colorScheme: z.string().max(50).optional(),
      count: z.number().int().min(1).max(4).optional(),
    })
    .optional(),
})

export const POST = handleRoute(
  async (request: NextRequest) => {
    const userId = await getRequiredUserId(request, { allowTestUserId: true })
    const body = await parseJson(request, generateSchema)

    // プロジェクト所有権確認
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    })
    if (!project) notFound('プロジェクトが見つかりません')
    if (project.userId !== userId) forbidden()

    // プラン確認（hasThumbnail ゲーティング）
    const billing = await getBillingSnapshot(userId)
    if (!billing.plan.hasThumbnail) {
      paymentRequired(
        'サムネイル生成にはProプラン以上が必要です'
      )
    }

    // 生成枚数
    const count = body.options?.count ?? 2

    // Thumbnail レコード作成
    const thumbnailIds = Array.from({ length: count }, () =>
      crypto.randomUUID()
    )
    await prisma.thumbnail.createMany({
      data: thumbnailIds.map((id) => ({
        id,
        projectId: body.projectId,
        mode: body.mode,
        templateId: body.templateId ?? null,
        prompt: body.prompt,
        stylePrompt: null,
        status: 'PROCESSING',
      })),
    })

    // AI生成（並列実行）
    const results = await generateMultipleThumbnails(body, thumbnailIds)

    // 結果をDBに反映
    const thumbnails = []
    for (const result of results) {
      if ('error' in result) {
        await prisma.thumbnail.update({
          where: { id: result.id },
          data: { status: 'FAILED', error: result.error },
        })
      } else {
        const imageUrl = `/api/thumbnail/generated/${result.id}`
        await prisma.thumbnail.update({
          where: { id: result.id },
          data: {
            status: 'COMPLETED',
            imageUrl,
            imagePath: result.imagePath,
          },
        })
        thumbnails.push({
          id: result.id,
          imageUrl,
          width: 1280,
          height: 720,
        })
      }
    }

    if (thumbnails.length === 0) {
      badRequest('サムネイル生成に失敗しました')
    }

    return ok({ thumbnails })
  },
  { onError: 'サムネイル生成に失敗しました' }
)
