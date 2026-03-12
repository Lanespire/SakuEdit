import { NextRequest, NextResponse } from 'next/server'
import { composeBGM } from '@/lib/beatoven-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, format, looping } = body as {
      prompt?: string
      format?: 'mp3' | 'aac' | 'wav'
      looping?: boolean
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt は必須です' },
        { status: 400 },
      )
    }

    const result = await composeBGM({ prompt, format, looping })
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
