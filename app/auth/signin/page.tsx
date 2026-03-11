'use client'

import { Suspense } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { authClient } from '@/lib/auth-client'
import { signInSchema, type SignInFormValues } from '@/lib/forms/auth'

const DEMO_USER_EMAIL = 'demo@sakuedit.local'
const DEMO_USER_PASSWORD = 'demo123456'

function SignInPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const callbackUrl = searchParams.get('callbackUrl') || '/projects'

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authClient.signIn.email(values)

      if (result.error) {
        setError('root', {
          message: result.error.message || 'ログインに失敗しました',
        })
        return
      }

      router.replace(callbackUrl)
    } catch {
      setError('root', {
        message: 'ログインに失敗しました',
      })
    }
  })

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🎬</span>
          <span className="text-2xl font-bold text-[#2d1f18] dark:text-white">SakuEdit</span>
        </Link>

        <div className="bg-white dark:bg-[#2a1d15] rounded-2xl border border-[#f0e6df] dark:border-[#3a2a20] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-[#2d1f18] dark:text-white mb-2 text-center">
            ログイン
          </h1>
          <p className="text-sm text-[#8a756b] text-center mb-6">
            アカウントにログインして編集を続けましょう
          </p>

          {errors.root?.message && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm" data-test-id="error-message">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2d1f18] dark:text-white mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 rounded-lg border border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#1a1614] text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-shadow"
                placeholder="you@example.com"
                required
                data-test-id="email-input"
              />
              {errors.email?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1f18] dark:text-white mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-3 rounded-lg border border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#1a1614] text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-shadow"
                placeholder="••••••••"
                required
                data-test-id="password-input"
              />
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-test-id="signin-button"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  ログイン中...
                </span>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Local Demo User
                  </p>
                  <p className="mt-1 text-sm text-[#6b584b] dark:text-[#c9b9ac]">
                    {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', DEMO_USER_EMAIL)
                    setValue('password', DEMO_USER_PASSWORD)
                    clearErrors()
                  }}
                  className="shrink-0 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  入力する
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-[#8a756b]">
              アカウントをお持ちでないですか？{' '}
              <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                新規登録
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-[#8a756b] hover:text-primary">
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span>
            <p className="mt-4 text-sm text-[#8a756b] dark:text-[#c9b9ac]">読み込み中...</p>
          </div>
        </div>
      }
    >
      <SignInPageContent />
    </Suspense>
  )
}
