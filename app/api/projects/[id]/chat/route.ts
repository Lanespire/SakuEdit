import { NextRequest, NextResponse } from 'next/server'
import { generateCompositionPatches } from '@/lib/ai-composition-chat'
import type { CompositionData } from '@/lib/composition-data'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  let body: {
    message: string
    compositionData: CompositionData
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { message, compositionData, chatHistory } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'message is required' },
      { status: 400 }
    )
  }

  if (!compositionData) {
    return NextResponse.json(
      { error: 'compositionData is required' },
      { status: 400 }
    )
  }

  try {
    const result = await generateCompositionPatches({
      userMessage: message,
      currentData: compositionData,
      chatHistory: chatHistory ?? [],
    })

    return NextResponse.json({
      projectId,
      ...result,
    })
  } catch (error) {
    console.error(`[chat] project=${projectId} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
