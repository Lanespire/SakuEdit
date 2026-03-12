import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getRequiredUserId, handleRoute, ok } from '@/lib/server/route'

export const GET = handleRoute(async (request: NextRequest) => {
  const userId = await getRequiredUserId(request)

  const styles = await prisma.style.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
  })

  return ok({ styles })
}, { onError: 'Failed to fetch styles' })
