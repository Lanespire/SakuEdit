import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        videos: true,
        subtitles: {
          orderBy: { startTime: 'asc' },
        },
        style: true,
        aiSuggestions: {
          orderBy: { priority: 'desc' },
        },
        timeline: {
          include: {
            tracks: {
              include: {
                clips: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        markers: {
          orderBy: { time: 'asc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id: projectId } = await params

    // Verify project ownership
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!existingProject || existingProject.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const allowedUpdates = [
      'name',
      'status',
      'progress',
      'progressMessage',
      'styleId',
      'startedAt',
      'completedAt',
      'canceledAt',
      'lastError',
    ]

    const updateData: any = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        videos: true,
        style: true,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project ownership
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!existingProject || existingProject.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
