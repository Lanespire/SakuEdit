import { NextRequest } from 'next/server'
import { handleRoute, ok } from '@/lib/server/route'
import { listVoices } from '@/lib/elevenlabs-client'

export const GET = handleRoute(async (_request: NextRequest) => {
  const voices = await listVoices()
  return ok({ voices })
}, { onError: 'Failed to fetch voices' })
