import { NextRequest, NextResponse } from 'next/server'
import { generateSoundEffect } from '@/lib/elevenlabs-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration } = body as {
      prompt?: string
      duration?: number
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt は必須です' },
        { status: 400 },
      )
    }

    const audioBuffer = await generateSoundEffect({
      prompt,
      durationSeconds: duration,
    })
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
