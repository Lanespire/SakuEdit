import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
  buildProcessingArtifactObjectKey,
  resolveProjectAssetUrl,
} from '@/lib/server/project-storage'
import {
  getLatestCompletedProcessingJob,
  PROCESSING_PIPELINE_VERSION,
} from '@/lib/server/processing-jobs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const latestProcessingJob = await getLatestCompletedProcessingJob(projectId)
  const pipelineVersion =
    latestProcessingJob?.pipelineVersion || PROCESSING_PIPELINE_VERSION
  const thumbnailPath =
    latestProcessingJob?.thumbnailPath ||
    buildProcessingArtifactObjectKey(projectId, pipelineVersion, 'thumbnail.jpg')

  const signedUrl = await resolveProjectAssetUrl(thumbnailPath, {
    expiresInSeconds: 60 * 60,
    contentType: 'image/jpeg',
  })

  return NextResponse.redirect(signedUrl)
}
