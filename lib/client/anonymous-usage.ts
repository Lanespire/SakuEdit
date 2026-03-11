import { initFingerprint } from '@/lib/fingerprint'

export interface AnonymousUsageInfo {
  dailyCount: number
  dailyLimit: number
  remaining: number
  maxVideoMinutes: number
  canProcess: boolean
  blockedUntil: string | null
}

export async function fetchAnonymousUsage(): Promise<AnonymousUsageInfo> {
  const fingerprint = await initFingerprint()
  const response = await fetch('/api/anonymous/usage', {
    headers: { 'x-fingerprint': fingerprint },
  })

  if (!response.ok) {
    throw new Error('匿名利用状況の取得に失敗しました')
  }

  return response.json() as Promise<AnonymousUsageInfo>
}
