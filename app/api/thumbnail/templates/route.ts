import { NextRequest } from 'next/server'
import { handleRoute, ok } from '@/lib/server/route'
import {
  THUMBNAIL_TEMPLATES,
  getTemplatesByCategory,
} from '@/lib/thumbnail-templates'

export const GET = handleRoute(
  async (request: NextRequest) => {
    const category = request.nextUrl.searchParams.get('category')

    const templates = category
      ? getTemplatesByCategory(
          category as 'gaming' | 'vlog' | 'education' | 'business' | 'entertainment'
        )
      : THUMBNAIL_TEMPLATES

    return ok({ templates })
  },
  { onError: 'テンプレート一覧の取得に失敗しました' }
)
