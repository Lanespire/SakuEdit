import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  const thumbnailPath = path.join(uploadDir, 'projects', projectId, 'thumbnail.jpg')

  try {
    await fs.access(thumbnailPath)
    const imageBuffer = await fs.readFile(thumbnailPath)

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // 1年間キャッシュ
      },
    })
  } catch {
    // サムネイルが存在しない場合は404
    return NextResponse.json(
      { error: 'Thumbnail not found' },
      { status: 404 }
    )
  }
}
