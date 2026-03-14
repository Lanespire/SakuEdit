import { createHash } from 'node:crypto'
import type { JobStatus, Prisma } from '@prisma/client'
import prisma from '@/lib/db'

export const PROCESSING_PIPELINE_VERSION = 'worker-v1'
const PROCESSING_HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000

type ProcessingOptions = Record<string, unknown> | undefined

type ProjectWithSourceVideo = Awaited<ReturnType<typeof getProjectWithSourceVideo>>

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    )
  }

  return value
}

function createStableHash(value: unknown) {
  const normalized = JSON.stringify(sortJsonValue(value))
  return createHash('sha256').update(normalized).digest('hex')
}

async function getProjectWithSourceVideo(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      videos: {
        where: { storagePath: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const sourceVideo = project.videos[0]

  if (!sourceVideo?.storagePath) {
    throw new Error('Project source video not found')
  }

  return {
    project,
    sourceVideo,
  }
}

function buildProcessingRequestKey(input: {
  projectId: string
  sourceStoragePath: string
  sourceUpdatedAt: Date
  options?: ProcessingOptions
}) {
  return createStableHash({
    pipelineVersion: PROCESSING_PIPELINE_VERSION,
    projectId: input.projectId,
    sourceStoragePath: input.sourceStoragePath,
    sourceUpdatedAt: input.sourceUpdatedAt.toISOString(),
    options: input.options ?? {},
  })
}

function getQueueStatusMessage() {
  return '処理キューに追加しました'
}

function isProcessingJobStale(job: {
  status: JobStatus
  lastHeartbeatAt: Date | null
}) {
  if (job.status !== 'PROCESSING' || !job.lastHeartbeatAt) {
    return false
  }

  return Date.now() - job.lastHeartbeatAt.getTime() > PROCESSING_HEARTBEAT_TIMEOUT_MS
}

async function mirrorProjectQueueState(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'QUEUED',
      progress: 0,
      progressMessage: getQueueStatusMessage(),
      lastError: null,
      startedAt: null,
      completedAt: null,
      canceledAt: null,
    },
  })
}

export async function enqueueProjectProcessing(input: {
  projectId: string
  userId?: string
  options?: ProcessingOptions
}) {
  const { project, sourceVideo } = await getProjectWithSourceVideo(input.projectId)

  if (input.userId && project.userId !== input.userId) {
    throw new Error('Project not found')
  }

  const requestKey = buildProcessingRequestKey({
    projectId: project.id,
    sourceStoragePath: sourceVideo.storagePath!,
    sourceUpdatedAt: sourceVideo.updatedAt,
    options: input.options,
  })

  const existingJob = await prisma.processingJob.findUnique({
    where: {
      projectId_requestKey: {
        projectId: project.id,
        requestKey,
      },
    },
  })

  if (!existingJob) {
    const job = await prisma.processingJob.create({
      data: {
        projectId: project.id,
        status: 'QUEUED',
        progress: 0,
        progressMessage: getQueueStatusMessage(),
        requestKey,
        pipelineVersion: PROCESSING_PIPELINE_VERSION,
        inputStoragePath: sourceVideo.storagePath!,
        optionsJson: JSON.stringify(sortJsonValue(input.options ?? {})),
        error: null,
      },
    })

    await mirrorProjectQueueState(project.id)

    return {
      job,
      shouldInvoke: true,
      reused: false,
    }
  }

  if (existingJob.status === 'PROCESSING') {
    if (isProcessingJobStale(existingJob)) {
      const job = await prisma.processingJob.update({
        where: { id: existingJob.id },
        data: {
          status: 'QUEUED',
          progress: 0,
          progressMessage: getQueueStatusMessage(),
          error: null,
          startedAt: null,
          completedAt: null,
          canceledAt: null,
          lastHeartbeatAt: null,
          optionsJson: JSON.stringify(sortJsonValue(input.options ?? {})),
          inputStoragePath: sourceVideo.storagePath!,
        },
      })

      await mirrorProjectQueueState(project.id)

      return {
        job,
        shouldInvoke: true,
        reused: true,
      }
    }

    return {
      job: existingJob,
      shouldInvoke: false,
      reused: true,
    }
  }

  if (existingJob.status === 'COMPLETED') {
    return {
      job: existingJob,
      shouldInvoke: false,
      reused: true,
    }
  }

  const job = await prisma.processingJob.update({
    where: { id: existingJob.id },
    data: {
      status: 'QUEUED',
      progress: 0,
      progressMessage: getQueueStatusMessage(),
      error: null,
      startedAt: null,
      completedAt: null,
      canceledAt: null,
      lastHeartbeatAt: null,
      optionsJson: JSON.stringify(sortJsonValue(input.options ?? {})),
      inputStoragePath: sourceVideo.storagePath!,
    },
  })

  await mirrorProjectQueueState(project.id)

  return {
    job,
    shouldInvoke: true,
    reused: true,
  }
}

export async function getProcessingJobForExecution(jobId: string) {
  return prisma.processingJob.findUnique({
    where: { id: jobId },
    include: {
      project: {
        include: {
          videos: {
            where: { storagePath: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          style: true,
          subtitles: {
            orderBy: { startTime: 'asc' },
          },
        },
      },
    },
  })
}

export async function getLatestCompletedProcessingJob(projectId: string) {
  return prisma.processingJob.findFirst({
    where: {
      projectId,
      status: 'COMPLETED',
    },
    orderBy: {
      completedAt: 'desc',
    },
  })
}

export async function recoverStaleProcessingJob(projectId: string) {
  const staleJob = await prisma.processingJob.findFirst({
    where: {
      projectId,
      status: 'PROCESSING',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  if (!staleJob || !isProcessingJobStale(staleJob)) {
    return {
      recovered: false,
      job: null,
    }
  }

  const updateResult = await prisma.processingJob.updateMany({
    where: {
      id: staleJob.id,
      status: 'PROCESSING',
      lastHeartbeatAt: staleJob.lastHeartbeatAt,
    },
    data: {
      status: 'QUEUED',
      progress: 0,
      progressMessage: getQueueStatusMessage(),
      error: null,
      startedAt: null,
      completedAt: null,
      canceledAt: null,
      lastHeartbeatAt: null,
    },
  })

  if (updateResult.count === 0) {
    return {
      recovered: false,
      job: null,
    }
  }

  await mirrorProjectQueueState(projectId)

  const job = await prisma.processingJob.findUnique({
    where: { id: staleJob.id },
  })

  return {
    recovered: true,
    job,
  }
}

export async function claimProcessingJob(jobId: string) {
  const startedAt = new Date()
  const result = await prisma.processingJob.updateMany({
    where: {
      id: jobId,
      status: 'QUEUED',
    },
    data: {
      status: 'PROCESSING',
      startedAt,
      lastHeartbeatAt: startedAt,
      attempt: {
        increment: 1,
      },
    },
  })

  if (result.count === 0) {
    const job = await getProcessingJobForExecution(jobId)

    if (!job) {
      throw new Error('Processing job not found')
    }

    return {
      job,
      claimed: false,
    }
  }

  const job = await getProcessingJobForExecution(jobId)

  if (!job) {
    throw new Error('Processing job not found')
  }

  return {
    job,
    claimed: true,
  }
}

async function updateJobAndProject(
  jobId: string,
  projectId: string,
  input: {
    job: Prisma.ProcessingJobUpdateInput
    project: Prisma.ProjectUpdateInput
  },
) {
  await prisma.$transaction([
    prisma.processingJob.update({
      where: { id: jobId },
      data: input.job,
    }),
    prisma.project.update({
      where: { id: projectId },
      data: input.project,
    }),
  ])
}

export async function updateProcessingProgress(input: {
  jobId: string
  projectId: string
  progress: number
  progressMessage: string
  status?: JobStatus
}) {
  const heartbeatAt = new Date()
  const nextStatus = input.status ?? 'PROCESSING'

  await updateJobAndProject(input.jobId, input.projectId, {
    job: {
      progress: input.progress,
      progressMessage: input.progressMessage,
      lastHeartbeatAt: heartbeatAt,
      status: nextStatus,
    },
    project: {
      status: 'PROCESSING',
      progress: input.progress,
      progressMessage: input.progressMessage,
      lastError: null,
      startedAt: heartbeatAt,
    },
  })
}

export async function markProcessingJobCompleted(input: {
  jobId: string
  projectId: string
  progressMessage: string
  outputVideoPath?: string
  audioPath?: string
  srtPath?: string
  thumbnailPath?: string
}) {
  const completedAt = new Date()

  await updateJobAndProject(input.jobId, input.projectId, {
    job: {
      status: 'COMPLETED',
      progress: 100,
      progressMessage: input.progressMessage,
      ...(input.outputVideoPath ? { outputVideoPath: input.outputVideoPath } : {}),
      ...(input.audioPath ? { audioPath: input.audioPath } : {}),
      ...(input.srtPath ? { srtPath: input.srtPath } : {}),
      ...(input.thumbnailPath ? { thumbnailPath: input.thumbnailPath } : {}),
      error: null,
      completedAt,
      lastHeartbeatAt: completedAt,
    },
    project: {
      status: 'COMPLETED',
      progress: 100,
      progressMessage: input.progressMessage,
      completedAt,
      lastError: null,
    },
  })
}

export async function markProcessingJobFailed(input: {
  jobId: string
  projectId: string
  errorMessage: string
  progress?: number
}) {
  const failedAt = new Date()

  await updateJobAndProject(input.jobId, input.projectId, {
    job: {
      status: 'FAILED',
      progress: input.progress ?? 0,
      progressMessage: '処理に失敗しました',
      error: input.errorMessage,
      completedAt: failedAt,
      lastHeartbeatAt: failedAt,
    },
    project: {
      status: 'ERROR',
      progress: input.progress ?? 0,
      progressMessage: '処理に失敗しました',
      lastError: input.errorMessage,
    },
  })
}

export async function markProcessingStartupFailure(input: {
  jobId: string
  projectId: string
  errorMessage: string
}) {
  const failedAt = new Date()

  await updateJobAndProject(input.jobId, input.projectId, {
    job: {
      status: 'FAILED',
      progress: 0,
      progressMessage: '処理の開始に失敗しました',
      error: input.errorMessage,
      completedAt: failedAt,
      lastHeartbeatAt: failedAt,
    },
    project: {
      status: 'ERROR',
      progress: 0,
      progressMessage: '処理の開始に失敗しました',
      lastError: input.errorMessage,
    },
  })
}

export function parseProcessingOptions(
  optionsJson: string | null | undefined,
): Record<string, unknown> | undefined {
  if (!optionsJson) {
    return undefined
  }

  const parsed = JSON.parse(optionsJson) as Record<string, unknown>
  return parsed && typeof parsed === 'object' ? parsed : undefined
}
