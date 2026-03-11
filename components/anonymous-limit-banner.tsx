'use client'

import { useSWR } from '@/lib/client/swr'
import {
  fetchAnonymousUsage,
  type AnonymousUsageInfo,
} from '@/lib/client/anonymous-usage'
import { LogIn, Sparkles, Zap } from 'lucide-react'

interface AnonymousLimitBannerProps {
  onLoginClick?: () => void
}

function useAnonymousUsage() {
  return useSWR<AnonymousUsageInfo>('anonymous-usage', fetchAnonymousUsage, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
}

function handleLogin(onLoginClick?: () => void, fallbackPath?: string) {
  if (onLoginClick) {
    onLoginClick()
    return
  }

  window.location.href = fallbackPath || '/auth/signin'
}

function UsageBannerBody({
  usage,
  onLoginClick,
}: {
  usage: AnonymousUsageInfo
  onLoginClick?: () => void
}) {
  const isNearLimit = usage.remaining <= 1
  const isAtLimit = !usage.canProcess

  return (
    <div
      className={`rounded-lg border p-4 ${
        isAtLimit
          ? 'border-red-200 bg-red-50'
          : isNearLimit
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-blue-200 bg-blue-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 rounded-full p-2 ${
            isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-blue-100'
          }`}
        >
          {isAtLimit ? (
            <Zap className="h-5 w-5 text-red-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-blue-600" />
          )}
        </div>

        <div className="flex-1">
          {isAtLimit ? (
            <>
              <h3 className="font-semibold text-red-900">
                本日の無料回数を使切りました
              </h3>
              <p className="mt-1 text-sm text-red-700">
                無料アカウント登録で <strong>1日10回</strong>、最大15分の動画を処理できます。
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900">
                残り {usage.remaining} 回 / {usage.dailyLimit} 回（無料）
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                ログインで <strong>1日10回</strong> に増量！最大15分まで処理可能に。
              </p>
            </>
          )}

          <button
            onClick={() => {
              handleLogin(
                onLoginClick,
                '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname),
              )
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-md"
          >
            <LogIn className="h-4 w-4" />
            無料登録して制限解除
          </button>
        </div>
      </div>
    </div>
  )
}

export function AnonymousLimitBanner({ onLoginClick }: AnonymousLimitBannerProps) {
  const { data: usage, isLoading } = useAnonymousUsage()

  if (isLoading || !usage) {
    return null
  }

  return <UsageBannerBody usage={usage} onLoginClick={onLoginClick} />
}

export function AnonymousLimitCompact({ onLoginClick }: AnonymousLimitBannerProps) {
  const { data: usage } = useAnonymousUsage()

  if (!usage) return null

  const isAtLimit = !usage.canProcess

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
        isAtLimit ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
      }`}
    >
      <span>
        {isAtLimit ? '回数制限に到達' : `残り ${usage.remaining} 回`}
      </span>
      <button
        onClick={() => {
          handleLogin(onLoginClick, '/auth/signin')
        }}
        className="font-medium underline hover:no-underline"
      >
        ログインで解除
      </button>
    </div>
  )
}
