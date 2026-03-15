import { NextRequest } from 'next/server'
import {
  getRequiredUserId,
  handleRoute,
  ok,
  parseJson,
} from '@/lib/server/route'
import { z } from 'zod'
import {
  enqueueProjectProcessing,
} from '@/lib/server/processing-jobs'
import { dispatchProcessingJobOrMarkFailure } from '@/lib/server/processing-dispatch'

const startProcessingSchema = z.object({
  projectId: z.string().trim().min(1),
  options: z.record(z.string(), z.unknown()).optional(),
})

export const POST = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request, { allowTestUserId: true })
  const body = await parseJson(request, startProcessingSchema)

  const { job, shouldInvoke, reused } = await enqueueProjectProcessing({
    projectId: body.projectId,
    userId,
    options: body.options,
  })

  if (shouldInvoke) {
    await dispatchProcessingJobOrMarkFailure({
      job,
      projectId: body.projectId,
    })
  }

  return ok({
    success: true,
    status: shouldInvoke ? 'queued' : job.status.toLowerCase(),
    jobId: job.id,
    reused,
  }, { status: 202 })
}, { onError: 'Failed to start processing' })
