import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required')
  }

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required')
  }

  const adapter = new PrismaLibSql({
    url,
    authToken,
  })

  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()
const DEMO_USER_EMAIL = 'demo@sakuedit.local'
const DEMO_USER_PASSWORD = 'demo123456'
const DEMO_USER_NAME = 'Demo User'

async function ensureDemoUser() {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const password = await hashPassword(DEMO_USER_PASSWORD)

  await prisma.account.deleteMany({
    where: {
      user: {
        email: DEMO_USER_EMAIL,
      },
    },
  })

  await prisma.user.deleteMany({
    where: { email: DEMO_USER_EMAIL },
  })

  const demoUser = await prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: DEMO_USER_NAME,
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      userId: demoUser.id,
      providerId: 'credential',
      accountId: demoUser.id,
      password,
    },
  })

  console.log('Demo user ready:', DEMO_USER_EMAIL)
}

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
      maxQuality: '4k',
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

  await ensureDemoUser()

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
