import { runProjectProcessing } from '../../lib/process-project'
import prisma from '../../lib/db'
import { verifyWhisperRuntime } from '../../lib/remotion-whisper-adapter'
import { getVideoBucketName } from '../../lib/server/video-bucket'
import { verifyVideoProcessingRuntime } from '../../lib/video-processor'

type LambdaEvent = {
  body?: string | null
  headers?: Record<string, string | undefined>
  requestContext?: {
    http?: {
      method?: string
    }
  }
}

function json(statusCode: number, payload: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }
}

function getRequiredWorkerToken() {
  const token = process.env.PROCESSING_WORKER_TOKEN

  if (!token) {
    throw new Error('PROCESSING_WORKER_TOKEN is required')
  }

  return token
}

function readHeader(
  headers: Record<string, string | undefined> | undefined,
  key: string,
) {
  if (!headers) {
    return undefined
  }

  const expectedKey = key.toLowerCase()
  const entry = Object.entries(headers).find(([headerKey]) => headerKey.toLowerCase() === expectedKey)
  return entry?.[1]
}

let startupCheckPromise: Promise<void> | null = null

async function verifyVideoProcessorStartup() {
  if (!startupCheckPromise) {
    startupCheckPromise = (async () => {
      getRequiredWorkerToken()
      getVideoBucketName()
      verifyVideoProcessingRuntime()
      await verifyWhisperRuntime()
      await prisma.$queryRaw`SELECT 1`
    })()
  }

  return startupCheckPromise
}

export async function main(event: LambdaEvent) {
  try {
    const method = event.requestContext?.http?.method ?? 'POST'
    if (method !== 'POST') {
      return json(405, { error: 'Method not allowed' })
    }

    const providedToken = readHeader(event.headers, 'x-sakuedit-worker-token')
    if (providedToken !== getRequiredWorkerToken()) {
      return json(401, { error: 'Unauthorized worker invoke' })
    }

    await verifyVideoProcessorStartup()

    const body = event.body ? JSON.parse(event.body) as { type?: string; jobId?: string } : {}
    if (body.type !== 'process-project') {
      return json(400, { error: 'Invalid worker payload type' })
    }

    if (!body.jobId) {
      return json(400, { error: 'jobId is required' })
    }

    const result = await runProjectProcessing({
      jobId: body.jobId,
    })

    return json(200, {
      success: true,
      result,
    })
  } catch (error) {
    console.error('Video processor worker failed', error)
    return json(500, {
      error: error instanceof Error ? error.message : 'Unknown worker error',
    })
  }
}
