import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getTursoConfig() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required')
  }

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required')
  }

  return {
    url,
    authToken,
  }
}

function createPrismaClient() {
  const tursoConfig = getTursoConfig()
  const adapter = new PrismaLibSql(tursoConfig)
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
