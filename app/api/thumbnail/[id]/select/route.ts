import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
} from '@/lib/server/route'

export const POST = handleRoute(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const userId = await getRequiredUserId(request, { allowTestUserId: true })
    const { id: thumbnailId } = await params

    // サムネイル存在・完了確認
    const thumbnail = await prisma.thumbnail.findUnique({
      where: { id: thumbnailId },
      include: { project: true },
    })

    if (!thumbnail) notFound('サムネイルが見つかりません')
    if (thumbnail.project.userId !== userId) forbidden()

    // Project.selectedThumbnailId を更新（Source of Truth）
    const project = await prisma.project.update({
      where: { id: thumbnail.projectId },
      data: { selectedThumbnailId: thumbnailId },
    })

    return ok({
      project: {
        id: project.id,
        selectedThumbnailId: project.selectedThumbnailId,
      },
    })
  },
  { onError: 'サムネイルの採用に失敗しました' }
)
