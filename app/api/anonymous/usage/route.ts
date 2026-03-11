import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  badRequest,
  fail,
  handleRoute,
  ok,
} from '@/lib/server/route'

// Anonymous user limits
const ANONYMOUS_DAILY_LIMIT = 3
const ANONYMOUS_MAX_VIDEO_MINUTES = 5

// Reset daily count if last reset was more than 24 hours ago
function needsReset(lastResetAt: Date): boolean {
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60)
  return hoursSinceReset >= 24
}

function getFingerprint(request: NextRequest) {
  const fingerprint = request.headers.get('x-fingerprint')
  if (!fingerprint) {
    badRequest('Fingerprint required')
  }

  return fingerprint
}

async function getNormalizedUsage(fingerprint: string) {
  let usage = await prisma.anonymousUsage.findUnique({
    where: { fingerprint },
  })

  if (!usage) {
    usage = await prisma.anonymousUsage.create({
      data: { fingerprint },
    })
  }

  if (needsReset(usage.lastResetAt)) {
    usage = await prisma.anonymousUsage.update({
      where: { fingerprint },
      data: {
        dailyCount: 0,
        lastResetAt: new Date(),
      },
    })
  }

  return usage
}

function toUsagePayload(usage: {
  dailyCount: number
  blockedUntil: Date | null
}) {
  return {
    dailyCount: usage.dailyCount,
    dailyLimit: ANONYMOUS_DAILY_LIMIT,
    remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - usage.dailyCount),
    maxVideoMinutes: ANONYMOUS_MAX_VIDEO_MINUTES,
    blockedUntil: usage.blockedUntil,
    canProcess: usage.dailyCount < ANONYMOUS_DAILY_LIMIT && !usage.blockedUntil,
  }
}

export const GET = handleRoute(async (request: NextRequest) => {
  const usage = await getNormalizedUsage(getFingerprint(request))

  return ok(toUsagePayload(usage))
}, { onError: 'Error fetching anonymous usage' })

export const POST = handleRoute(async (request: NextRequest) => {
  const fingerprint = getFingerprint(request)
  let usage = await getNormalizedUsage(fingerprint)

  if (usage.dailyCount >= ANONYMOUS_DAILY_LIMIT) {
    fail(429, 'Daily limit reached', {
      dailyLimit: ANONYMOUS_DAILY_LIMIT,
      remaining: 0,
      canProcess: false,
    })
  }

  usage = await prisma.anonymousUsage.update({
    where: { fingerprint },
    data: {
      dailyCount: { increment: 1 },
      totalCount: { increment: 1 },
      lastSeenAt: new Date(),
    },
  })

  return ok({
    success: true,
    dailyCount: usage.dailyCount,
    dailyLimit: ANONYMOUS_DAILY_LIMIT,
    remaining: Math.max(0, ANONYMOUS_DAILY_LIMIT - usage.dailyCount),
    canProcess: usage.dailyCount < ANONYMOUS_DAILY_LIMIT,
  })
}, { onError: 'Error incrementing anonymous usage' })
