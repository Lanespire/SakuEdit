import { SubscriptionStatus } from '@prisma/client'
import prisma from './db'
import {
  calculateBilledSeconds,
  canUseQuality,
  getPlanDefinitionByName,
  requiresSrtOption,
  type ExportQuality,
  type PlanDefinition,
  type PlanId,
  type SubtitleExportOption,
} from './plans'

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
]

export interface ResolvedUserPlan {
  plan: PlanDefinition
  subscription: {
    status: SubscriptionStatus | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
  }
}

export interface BillingSnapshot extends ResolvedUserPlan {
  usedSeconds: number
  remainingSeconds: number
  billedWindowStart: Date
  billedWindowEnd: Date
}

function getCalendarBillingWindow(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start, end }
}

export async function resolveUserPlan(userId: string): Promise<ResolvedUserPlan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACTIVE_SUBSCRIPTION_STATUSES },
    },
    include: {
      plan: true,
    },
    orderBy: {
      currentPeriodEnd: 'desc',
    },
  })

  let plan = getPlanDefinitionByName(subscription?.plan.name)

  // 買い切りプランの有効期限チェック: currentPeriodEnd を過ぎていたら free に fallback
  if (
    plan.id === 'one-time' &&
    subscription?.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    plan = getPlanDefinitionByName('free')
  }

  return {
    plan,
    subscription: {
      status: subscription?.status ?? null,
      stripeCustomerId: subscription?.stripeCustomerId ?? null,
      stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    },
  }
}

export function isPremiumPlan(planId: PlanId): boolean {
  return planId !== 'free'
}

export async function getBillingSnapshot(userId: string): Promise<BillingSnapshot> {
  const resolved = await resolveUserPlan(userId)
  const fallbackWindow = getCalendarBillingWindow(new Date())
  const billedWindowStart = resolved.subscription.currentPeriodStart ?? fallbackWindow.start
  const billedWindowEnd = resolved.subscription.currentPeriodEnd ?? fallbackWindow.end

  const usage = await prisma.usageLog.aggregate({
    where: {
      userId,
      action: 'export',
      createdAt: {
        gte: billedWindowStart,
        lt: billedWindowEnd,
      },
    },
    _sum: {
      duration: true,
    },
  })

  const usedSeconds = usage._sum.duration ?? 0
  const monthlyLimitSeconds = resolved.plan.monthlyProcessingMinutes * 60

  return {
    ...resolved,
    usedSeconds,
    remainingSeconds: Math.max(0, monthlyLimitSeconds - usedSeconds),
    billedWindowStart,
    billedWindowEnd,
  }
}

export function validateExportAccess(
  planId: PlanId,
  options: {
    quality: ExportQuality
    subtitleOption: SubtitleExportOption
    removeWatermark: boolean
    exportThumbnail: boolean
  },
): string | null {
  const plan = getPlanDefinitionByName(planId)

  if (!canUseQuality(plan.id, options.quality)) {
    if (options.quality === '4k') {
      return '4K書き出しはBusiness以上で利用できます'
    }
    return `${options.quality} 書き出しは現在のプランでは利用できません`
  }

  if (options.removeWatermark && plan.hasWatermark) {
    return 'ウォーターマーク削除は有料プランで利用できます'
  }

  if (options.exportThumbnail && !plan.hasThumbnail) {
    return 'サムネイル書き出しはPro以上で利用できます'
  }

  if (requiresSrtOption(options.subtitleOption) && !plan.hasSrtExport) {
    return 'SRT字幕ファイルの書き出しはPro以上で利用できます'
  }

  return null
}

export function calculateExportChargeSeconds(durationSeconds: number, quality: ExportQuality): number {
  return calculateBilledSeconds(durationSeconds, quality)
}

