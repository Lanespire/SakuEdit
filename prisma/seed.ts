import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 既存のプランを削除（開発環境用）
  await prisma.plan.deleteMany()

  // Freeプラン
  const freePlan = await prisma.plan.create({
    data: {
      name: 'free',
      displayName: 'Free',
      price: 0,
      interval: 'month',
      maxSingleVideoMinutes: 10,
      monthlyProcessingMinutes: 90,
      monthlyStyleAnalysisCount: 0,
      styleSlots: 3,
      maxQuality: '720p',
      hasWatermark: true,
      hasSrtExport: false,
      hasThumbnail: false,
      hasPriorityQueue: false,
      teamSeats: 0,
    },
  })
  console.log('Created Free plan:', freePlan.id)

  // Proプラン
  const proPlan = await prisma.plan.create({
    data: {
      name: 'pro',
      displayName: 'Pro',
      price: 2480,
      interval: 'month',
      maxSingleVideoMinutes: 30,
      monthlyProcessingMinutes: 600,
      monthlyStyleAnalysisCount: 10,
      styleSlots: 20,
      maxQuality: '1080p',
      hasWatermark: false,
      hasSrtExport: true,
      hasThumbnail: true,
      hasPriorityQueue: true,
      teamSeats: 0,
    },
  })
  console.log('Created Pro plan:', proPlan.id)

  // Businessプラン
  const businessPlan = await prisma.plan.create({
    data: {
      name: 'business',
      displayName: 'Business',
      price: 8980,
      interval: 'month',
      maxSingleVideoMinutes: 90,
      monthlyProcessingMinutes: 2400,
      monthlyStyleAnalysisCount: 50,
      styleSlots: 100,
      maxQuality: '1080p',
      hasWatermark: false,
      hasSrtExport: true,
      hasThumbnail: true,
      hasPriorityQueue: true,
      teamSeats: 3,
    },
  })
  console.log('Created Business plan:', businessPlan.id)

  // Enterpriseプラン（カスタムプランとして扱う）
  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'enterprise',
      displayName: 'Enterprise',
      price: 0,
      interval: 'month',
      maxSingleVideoMinutes: 9999,
      monthlyProcessingMinutes: 999999,
      monthlyStyleAnalysisCount: 999,
      styleSlots: 9999,
      maxQuality: '4k',
      hasWatermark: false,
      hasSrtExport: true,
      hasThumbnail: true,
      hasPriorityQueue: true,
      teamSeats: 0, // 個別設定
    },
  })
  console.log('Created Enterprise plan:', enterprisePlan.id)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
