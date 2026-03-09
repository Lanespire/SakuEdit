import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/projects - Get all projects for current user
export async function GET(request: NextRequest) {
  try {
    // Check for test mode (development only)
    const { searchParams } = new URL(request.url)
    const testUserId = searchParams.get('testUserId')
    const isTestMode = process.env.NODE_ENV === 'development' && testUserId

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

    const status = searchParams.get('status')

    const where = {
      userId,
      ...(status && { status: status as any }),
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
    // Check for test mode (development only)
    const { searchParams } = new URL(request.url)
    const testUserId = searchParams.get('testUserId')
    const isTestMode = process.env.NODE_ENV === 'development' && testUserId

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

    const body = await request.json()
    const { name, styleId, sourceType, sourceUrl } = body

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
