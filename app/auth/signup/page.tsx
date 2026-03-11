'use client'

import { Suspense } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { authClient } from '@/lib/auth-client'
import {
  buildDisplayName,
  signUpSchema,
  type SignUpFormValues,
} from '@/lib/forms/auth'

function SignUpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const callbackUrl = searchParams.get('callbackUrl') || '/projects'

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      const result = await authClient.signUp.email({
        name: buildDisplayName(email),
        email,
        password,
      })

      if (result.error) {
        setError('root', {
          message: result.error.message || 'アカウント作成に失敗しました',
        })
        return
      }

      router.replace(callbackUrl)
    } catch {
      setError('root', {
        message: 'アカウント作成に失敗しました',
      })
    }
  })

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🎬</span>
          <span className="text-2xl font-bold text-[#2d1f18] dark:text-white">SakuEdit</span>
        </Link>

        <div className="bg-white dark:bg-[#2a1d15] rounded-2xl border border-[#f0e6df] dark:border-[#3a2a20] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-[#2d1f18] dark:text-white mb-2 text-center">
            新規登録
          </h1>
          <p className="text-sm text-[#8a756b] text-center mb-6">
            無料アカウントを作成して始めましょう
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
                placeholder="8文字以上"
                required
                minLength={8}
                data-test-id="password-input"
              />
              {errors.password?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1f18] dark:text-white mb-1.5">
                パスワード確認
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-4 py-3 rounded-lg border border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#1a1614] text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-shadow"
                placeholder="パスワードを再入力"
                required
                data-test-id="confirm-password-input"
              />
              {errors.confirmPassword?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-xs text-[#8a756b]">
              表示名はメールアドレスから自動で作成されます。
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-test-id="signup-button"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  作成中...
                </span>
              ) : (
                'アカウント作成'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-[#8a756b] text-center">
            アカウントを作成することで、
            <Link href="/terms" className="text-primary hover:underline">利用規約</Link>
            {' '}と{' '}
            <Link href="/privacy" className="text-primary hover:underline">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#8a756b]">
              すでにアカウントをお持ちですか？{' '}
              <Link href="/auth/signin" className="text-primary font-medium hover:underline">
                ログイン
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

export default function SignUpPage() {
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
      <SignUpPageContent />
    </Suspense>
  )
}
