import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Anonymous user limits
const ANONYMOUS_DAILY_LIMIT = 3
const ANONYMOUS_MAX_VIDEO_MINUTES = 5

// Reset daily count if last reset was more than 24 hours ago
function needsReset(lastResetAt: Date): boolean {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60)
  return hoursSinceReset >= 24
}

// GET /api/anonymous/usage - Get current usage for fingerprint
export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.headers.get('x-fingerprint')

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint required' },
        { status: 400 }
      )
    }

    let usage = await prisma.anonymousUsage.findUnique({
      where: { fingerprint },
    })

    // Create new record if not exists
    if (!usage) {
      usage = await prisma.anonymousUsage.create({
        data: { fingerprint },
      })
    }

    // Reset daily count if needed
    if (needsReset(usage.lastResetAt)) {
      usage = await prisma.anonymousUsage.update({
        where: { fingerprint },
        data: {
          dailyCount: 0,
          lastResetAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      dailyCount: usage.dailyCount,
      dailyLimit: ANONYMOUS_DAILY_LIMIT,
      remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - usage.dailyCount),
      maxVideoMinutes: ANONYMOUS_MAX_VIDEO_MINUTES,
      blockedUntil: usage.blockedUntil,
      canProcess: usage.dailyCount < ANONYMOUS_DAILY_LIMIT && !usage.blockedUntil,
    })
  } catch (error) {
    console.error('Error fetching anonymous usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/anonymous/usage - Increment usage count
export async function POST(request: NextRequest) {
  try {
    const fingerprint = request.headers.get('x-fingerprint')

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint required' },
        { status: 400 }
      )
    }

    let usage = await prisma.anonymousUsage.findUnique({
      where: { fingerprint },
    })

    // Create new record if not exists
    if (!usage) {
      usage = await prisma.anonymousUsage.create({
        data: { fingerprint },
      })
    }

    // Reset daily count if needed
    if (needsReset(usage.lastResetAt)) {
      usage = await prisma.anonymousUsage.update({
        where: { fingerprint },
        data: {
          dailyCount: 0,
          lastResetAt: new Date(),
        },
      })
    }

    // Check if limit reached
    if (usage.dailyCount >= ANONYMOUS_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily limit reached',
          dailyLimit: ANONYMOUS_DAILY_LIMIT,
          remaining: 0,
          canProcess: false,
        },
        { status: 429 }
      )
    }

    // Increment count
    usage = await prisma.anonymousUsage.update({
      where: { fingerprint },
      data: {
        dailyCount: { increment: 1 },
        totalCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      dailyCount: usage.dailyCount,
      dailyLimit: ANONYMOUS_DAILY_LIMIT,
      remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - usage.dailyCount),
      canProcess: usage.dailyCount < ANONYMOUS_DAILY_LIMIT,
    })
  } catch (error) {
    console.error('Error incrementing anonymous usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
