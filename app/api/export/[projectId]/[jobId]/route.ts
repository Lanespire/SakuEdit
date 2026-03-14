import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; jobId: string }> },
) {
  try {
    const url = new URL(request.url)
    const testUserId = url.searchParams.get('testUserId')
    const isTestMode = process.env.NODE_ENV !== 'production' && testUserId

    let userId: string

    if (isTestMode) {
      userId = testUserId!
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      userId = session.user.id
    }

    const { projectId, jobId } = await params

    const exportJob = await prisma.exportJob.findUnique({
      where: { id: jobId },
      include: {
        project: true,
      },
    })

    if (!exportJob || exportJob.projectId !== projectId || exportJob.project.userId !== userId) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: exportJob.status === 'COMPLETED',
      exportJob,
      downloadUrl: exportJob.status === 'COMPLETED' ? exportJob.videoUrl : null,
    })
  } catch (error) {
    console.error('Export status error:', error)
    return NextResponse.json({ error: 'Failed to fetch export status' }, { status: 500 })
  }
}
