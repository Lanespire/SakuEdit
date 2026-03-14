export type PlanId = 'free' | 'pro' | 'business' | 'enterprise'
export type ExportQuality = '720p' | '1080p' | '4k'
export type SubtitleExportOption = 'burn' | 'srt' | 'both'

export interface PlanDefinition {
  id: PlanId
  displayName: string
  description: string
  monthlyPriceYen: number | null
  priceLabel: string
  periodLabel: string
  ctaLabel: string
  checkoutEnabled: boolean
  monthlyProcessingMinutes: number
  maxSingleVideoMinutes: number
  monthlyStyleAnalysisCount: number
  maxQuality: ExportQuality
  hasWatermark: boolean
  hasSrtExport: boolean
  hasThumbnail: boolean
  monthlyThumbnailCount: number
  hasPriorityQueue: boolean
  teamSeats: number
}

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'business', 'enterprise']
export const PUBLIC_PLAN_IDS: PlanId[] = ['free', 'pro', 'business']
export const BILLABLE_PLAN_IDS: PlanId[] = ['pro', 'business']

export const ONE_TIME_PACK_SUGGESTION = {
  id: 'one-time-pack',
  displayName: '買い切りパック',
  description: '月額契約をせずに 1 から 3 本仕上げたい方向けの設計案',
  priceLabel: '¥4,980',
  periodLabel: '/買い切り',
  processingMinutes: 180,
  validDays: 30,
  maxSingleVideoMinutes: 60,
  maxQuality: '1080p' as const,
  hasSrtExport: true,
  hasThumbnail: true,
}

export const QUALITY_MULTIPLIERS: Record<ExportQuality, number> = {
  '720p': 1,
  '1080p': 1,
  '4k': 1.5,
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    displayName: 'Free',
    description: 'まずは品質を試したい方に',
    monthlyPriceYen: 0,
    priceLabel: '¥0',
    periodLabel: '/月',
    ctaLabel: '無料で始める',
    checkoutEnabled: false,
    monthlyProcessingMinutes: 90,
    maxSingleVideoMinutes: 10,
    monthlyStyleAnalysisCount: 0,
    maxQuality: '720p',
    hasWatermark: true,
    hasSrtExport: false,
    hasThumbnail: false,
    monthlyThumbnailCount: 0,
    hasPriorityQueue: false,
    teamSeats: 0,
  },
  pro: {
    id: 'pro',
    displayName: 'Pro',
    description: '継続的に動画制作する個人向け',
    monthlyPriceYen: 2480,
    priceLabel: '¥2,480',
    periodLabel: '/月',
    ctaLabel: 'Proを始める',
    checkoutEnabled: true,
    monthlyProcessingMinutes: 600,
    maxSingleVideoMinutes: 30,
    monthlyStyleAnalysisCount: 10,
    maxQuality: '1080p',
    hasWatermark: false,
    hasSrtExport: true,
    hasThumbnail: true,
    monthlyThumbnailCount: 10,
    hasPriorityQueue: false,
    teamSeats: 0,
  },
  business: {
    id: 'business',
    displayName: 'Business',
    description: '4K書き出しと長尺動画に対応した運用向け',
    monthlyPriceYen: 8980,
    priceLabel: '¥8,980',
    periodLabel: '/月',
    ctaLabel: 'Businessを始める',
    checkoutEnabled: true,
    monthlyProcessingMinutes: 2400,
    maxSingleVideoMinutes: 90,
    monthlyStyleAnalysisCount: 50,
    maxQuality: '4k',
    hasWatermark: false,
    hasSrtExport: true,
    hasThumbnail: true,
    monthlyThumbnailCount: 50,
    hasPriorityQueue: false,
    teamSeats: 0,
  },
  enterprise: {
    id: 'enterprise',
    displayName: 'Enterprise',
    description: '大量処理の個別相談向け',
    monthlyPriceYen: null,
    priceLabel: '要相談',
    periodLabel: '',
    ctaLabel: 'お問い合わせ',
    checkoutEnabled: false,
    monthlyProcessingMinutes: 999999,
    maxSingleVideoMinutes: 9999,
    monthlyStyleAnalysisCount: 999,
    maxQuality: '4k',
    hasWatermark: false,
    hasSrtExport: true,
    hasThumbnail: true,
    monthlyThumbnailCount: 999,
    hasPriorityQueue: false,
    teamSeats: 0,
  },
}

const QUALITY_ORDER: ExportQuality[] = ['720p', '1080p', '4k']

export function isPlanId(value: string): value is PlanId {
  return value in PLAN_DEFINITIONS
}

export function getPlanDefinition(planId: PlanId): PlanDefinition {
  return PLAN_DEFINITIONS[planId]
}

export function getPlanDefinitionByName(planName?: string | null): PlanDefinition {
  if (planName && isPlanId(planName)) {
    return PLAN_DEFINITIONS[planName]
  }

  return PLAN_DEFINITIONS.free
}

export function canUseQuality(planId: PlanId, quality: ExportQuality): boolean {
  return QUALITY_ORDER.indexOf(quality) <= QUALITY_ORDER.indexOf(getPlanDefinition(planId).maxQuality)
}

export function calculateBilledSeconds(durationSeconds: number, quality: ExportQuality): number {
  return Math.ceil(durationSeconds * QUALITY_MULTIPLIERS[quality])
}

export function requiresSrtOption(subtitleOption: SubtitleExportOption): boolean {
  return subtitleOption === 'srt' || subtitleOption === 'both'
}
