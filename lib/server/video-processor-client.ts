import { Resource } from 'sst'

function getProcessingWorkerToken() {
  const token = process.env.PROCESSING_WORKER_TOKEN

  if (!token) {
    throw new Error('PROCESSING_WORKER_TOKEN is required')
  }

  return token
}

function getVideoProcessorUrl() {
  const linkedResources = Resource as unknown as Record<string, { url?: string } | undefined>
  const url = linkedResources.VideoProcessor?.url

  if (!url) {
    throw new Error('Resource.VideoProcessor.url is required')
  }

  return url
}

export async function invokeProcessingJob(jobId: string) {
  const response = await fetch(getVideoProcessorUrl(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-amz-invocation-type': 'Event',
      'x-sakuedit-worker-token': getProcessingWorkerToken(),
    },
    body: JSON.stringify({
      type: 'process-project',
      jobId,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`VideoProcessor invocation failed (${response.status}): ${body}`)
  }
}
