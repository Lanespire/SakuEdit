import { NextRequest, NextResponse } from 'next/server'
import { generateVoiceover } from '@/lib/elevenlabs-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId } = body as {
      text?: string
      voiceId?: string
    }

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'text と voiceId は必須です' },
        { status: 400 },
      )
    }

    const audioBuffer = await generateVoiceover({ text, voiceId })
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
