import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import prisma from '@/lib/db'
import { file, handleRoute, notFound } from '@/lib/server/route'

export const GET = handleRoute(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params

    const thumbnail = await prisma.thumbnail.findUnique({
      where: { id },
    })

    if (!thumbnail || !thumbnail.imagePath) {
      notFound('サムネイル画像が見つかりません')
    }

    let buffer: Buffer
    try {
      buffer = await fs.readFile(thumbnail.imagePath)
    } catch {
      notFound('サムネイル画像ファイルが見つかりません')
    }

    return file(new Uint8Array(buffer), {
      'Content-Type': 'image/png',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=86400',
    })
  },
  { onError: 'サムネイル画像の取得に失敗しました' }
)
