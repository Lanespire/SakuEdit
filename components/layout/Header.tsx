'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { authClient } from '@/lib/auth-client'

interface HeaderProps {
  currentPage?: 'edit' | 'styles' | 'history'
}

export default function Header({ currentPage }: HeaderProps) {
  const { data: session } = authClient.useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const initials = session?.user?.name?.slice(0, 2).toUpperCase() || 'U'
  const isAuthenticated = isHydrated && Boolean(session?.user)

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
              href="/home"
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
              マイスタイル
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
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-[#f4ece6] bg-white px-2 py-1.5 text-[#1c130d] shadow-sm transition-colors hover:border-primary/40 hover:text-primary dark:border-[#3a2e26] dark:bg-[#2f2016] dark:text-white"
                data-test-id="header-avatar"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary-light text-sm font-bold text-white ring-2 ring-white dark:ring-[#23170f]">
                  {initials}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold md:block">
                  {session?.user?.name || 'ユーザー'}
                </span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-[#f4ece6] bg-white shadow-xl dark:border-[#3a2e26] dark:bg-[#2f2016]">
                  <div className="border-b border-[#f4ece6] px-4 py-4 dark:border-[#3a2e26]">
                    <p className="text-sm font-bold text-[#1c130d] dark:text-white">
                      {session?.user?.name || 'ユーザー'}
                    </p>
                    {session?.user?.email && (
                      <p className="mt-1 text-xs text-[#6b584b] dark:text-[#9e8b7d]">
                        {session.user.email}
                      </p>
                    )}
                  </div>

                  <div className="p-2">
                    <Link
                      href="/projects"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6b584b] transition-colors hover:bg-[#f8efe8] hover:text-primary dark:text-[#9e8b7d] dark:hover:bg-[#3a2e26]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[18px]">video_library</span>
                      マイプロジェクト
                    </Link>
                    <Link
                      href="/styles"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#6b584b] transition-colors hover:bg-[#f8efe8] hover:text-primary dark:text-[#9e8b7d] dark:hover:bg-[#3a2e26]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[18px]">style</span>
                      マイスタイル
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#6b584b] transition-colors hover:bg-[#fff1ea] hover:text-primary dark:text-[#9e8b7d] dark:hover:bg-[#3a2e26]"
                      onClick={async () => {
                        await authClient.signOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isHydrated ? (
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-[#6b584b] dark:text-[#9e8b7d] hover:text-primary transition-colors"
              data-test-id="header-login"
            >
              ログイン
            </Link>
          ) : (
            <div className="h-10 w-24" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  )
}
