'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'ログインに失敗しました')
      } else {
        router.push('/projects')
      }
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🎬</span>
          <span className="text-2xl font-bold text-[#2d1f18] dark:text-white">SakuEdit</span>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-[#2a1d15] rounded-2xl border border-[#f0e6df] dark:border-[#3a2a20] p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-[#2d1f18] dark:text-white mb-2 text-center">
            ログイン
          </h1>
          <p className="text-sm text-[#8a756b] text-center mb-6">
            アカウントにログインして編集を続けましょう
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm" data-test-id="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2d1f18] dark:text-white mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#1a1614] text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-shadow"
                placeholder="you@example.com"
                required
                data-test-id="email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1f18] dark:text-white mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#1a1614] text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-shadow"
                placeholder="••••••••"
                required
                data-test-id="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-test-id="signin-button"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  ログイン中...
                </span>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

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
