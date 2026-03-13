import {
  markProcessingStartupFailure,
  enqueueProjectProcessing,
} from '@/lib/server/processing-jobs'
import { invokeProcessingJob } from '@/lib/server/video-processor-client'

type EnqueuedProcessingJob = Awaited<ReturnType<typeof enqueueProjectProcessing>>['job']

export async function dispatchProcessingJobOrMarkFailure(input: {
  job: EnqueuedProcessingJob
  projectId: string
}) {
  try {
    await invokeProcessingJob(input.job.id)
  } catch (error) {
    console.error('Processing dispatch failed:', error)
    await markProcessingStartupFailure({
      jobId: input.job.id,
      projectId: input.projectId,
      errorMessage: error instanceof Error ? error.message : 'Unknown dispatch error',
    })
  }
}
