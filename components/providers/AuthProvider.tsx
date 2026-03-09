'use client'

import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // Better Auth doesn't require a provider wrapper
  // The authClient is already configured with hooks
  return <>{children}</>
}
