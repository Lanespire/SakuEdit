import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './db'

function getRequiredAuthBaseUrl() {
  const authBaseUrl = process.env.BETTER_AUTH_URL

  if (!authBaseUrl) {
    throw new Error('BETTER_AUTH_URL is required')
  }

  return authBaseUrl
}

const authBaseUrl = getRequiredAuthBaseUrl()

function buildTrustedOrigins(baseUrl: string) {
  const origin = new URL(baseUrl)
  const origins = new Set([origin.origin])

  if (origin.hostname === 'localhost') {
    origins.add(`${origin.protocol}//127.0.0.1:${origin.port}`)
  }

  if (origin.hostname === '127.0.0.1') {
    origins.add(`${origin.protocol}//localhost:${origin.port}`)
  }

  return [...origins]
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: authBaseUrl,
  trustedOrigins: buildTrustedOrigins(authBaseUrl),
})

export type Auth = typeof auth
