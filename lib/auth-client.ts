import { createAuthClient } from 'better-auth/react'

const authClientConfig = process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  ? { baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL }
  : {}

export const authClient = createAuthClient(authClientConfig)

export const { signIn, signOut, signUp, useSession } = authClient
