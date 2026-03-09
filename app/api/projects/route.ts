import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { ProjectStatus } from '@prisma/client'

const projectStatuses = new Set<string>(Object.values(ProjectStatus))

// GET /api/projects - Get all projects for current user
export async function GET(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    let userId: string

    if (isDevelopment) {
      userId = 'test-user-dev'
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectStatus = status && projectStatuses.has(status)
      ? (status as ProjectStatus)
      : undefined

    const where = {
      userId,
      ...(projectStatus && { status: projectStatus }),
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        videos: true,
        style: true,
        _count: {
          select: { subtitles: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    let userId: string

    if (isDevelopment) {
      userId = 'test-user-dev'
    } else {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id
    }

    const body = await request.json()
    const { name, styleId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        styleId: styleId || null,
        status: 'UPLOADING',
      },
      include: {
        style: true,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
