'use client'

import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

interface HeaderProps {
  currentPage?: 'edit' | 'styles' | 'history'
}

export default function Header({ currentPage }: HeaderProps) {
  const { data: session } = authClient.useSession()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#f4ece6] dark:border-[#3a2e26] h-16"
      data-test-id="header"
    >
      <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" data-test-id="header-logo">
            <span className="text-2xl">🎬</span>
            <span className="font-bold text-lg tracking-tight text-[#1c130d] dark:text-white">
              SakuEdit
            </span>
          </Link>
        </div>

        {session?.user && (
          <nav
            className="hidden md:flex items-center gap-1 bg-white dark:bg-[#2f2016] p-1 rounded-full border border-[#f4ece6] dark:border-[#3a2e26]"
            data-test-id="header-nav"
          >
            <Link
              href="/"
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'edit'
                  ? 'bg-[#1c130d] dark:bg-white text-white dark:text-[#1c130d]'
                  : 'text-[#6b584b] dark:text-[#9e8b7d] hover:bg-[#f4ece6] dark:hover:bg-[#3a2e26]'
              }`}
              data-test-id="nav-edit"
            >
              編集
            </Link>
            <Link
              href="/styles"
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'styles'
                  ? 'bg-[#1c130d] dark:bg-white text-white dark:text-[#1c130d]'
                  : 'text-[#6b584b] dark:text-[#9e8b7d] hover:bg-[#f4ece6] dark:hover:bg-[#3a2e26]'
              }`}
              data-test-id="nav-styles"
            >
              スタイル学習
            </Link>
            <Link
              href="/projects"
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'history'
                  ? 'bg-[#1c130d] dark:bg-white text-white dark:text-[#1c130d]'
                  : 'text-[#6b584b] dark:text-[#9e8b7d] hover:bg-[#f4ece6] dark:hover:bg-[#3a2e26]'
              }`}
              data-test-id="nav-history"
            >
              履歴
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <button
                className="text-[#6b584b] dark:text-[#9e8b7d] hover:text-primary transition-colors p-1 relative"
                data-test-id="header-notifications"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#23170f]"></span>
              </button>
              <button
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-[#23170f]"
                data-test-id="header-avatar"
                onClick={() => authClient.signOut()}
              >
                {session.user.name?.slice(0, 2).toUpperCase() || 'U'}
              </button>
            </>
          ) : (
            <Link
              href="/api/auth/signin"
              className="px-4 py-2 text-sm font-medium text-[#6b584b] dark:text-[#9e8b7d] hover:text-primary transition-colors"
              data-test-id="header-login"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
