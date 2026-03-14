'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Header } from '@/components/layout'
import { useSession } from '@/lib/auth-client'
import { postJson } from '@/lib/client/http'
import { startProjectProcessing } from '@/lib/client/project-processing'
import { useSWR } from '@/lib/client/swr'
import { getStylePresetCategories, STYLE_PRESETS } from '@/lib/style-presets'

const styleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string(),
  referenceUrl: z.string().nullable().optional(),
  sourceChannel: z.string().nullable().optional(),
  updatedAt: z.string().or(z.date()),
  _count: z
    .object({
      projects: z.number(),
    })
    .optional(),
})

const stylesResponseSchema = z.object({
  styles: z.array(styleSchema),
})

type UserStyle = z.infer<typeof styleSchema>

const presetCategories = getStylePresetCategories()

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

async function loadStyles(url: string) {
  const response = await fetch(url)

  if (response.status === 401) {
    throw new Error('ログインが必要です')
  }

  if (!response.ok) {
    throw new Error('スタイル一覧の取得に失敗しました')
  }

  return stylesResponseSchema.parse(await response.json())
}

function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-full max-w-xl">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8a756b]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="スタイルを検索..."
        className="w-full rounded-2xl border border-[#f0e6df] bg-white py-3 pl-11 pr-4 text-sm text-[#2d1f18] shadow-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  )
}

function PresetCard({
  preset,
  onApply,
}: {
  preset: (typeof STYLE_PRESETS)[number]
  onApply: (presetId: string) => void
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] border border-[#f0e6df] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className={`relative aspect-video ${preset.coverImage ? '' : `bg-gradient-to-br ${preset.coverGradient}`}`}>
        {preset.coverImage && (
          <Image src={preset.coverImage} alt={preset.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        )}
        <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white">
          {preset.badge}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4">
          <span className="rounded-full bg-white/85 px-2 py-1 text-[10px] font-bold text-[#2d1f18]">
            {preset.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black text-[#2d1f18]">{preset.name}</h3>
          <span
            className="rounded-full px-2 py-1 text-[10px] font-bold"
            style={{
              backgroundColor: `${preset.accentColor}15`,
              color: preset.accentColor,
            }}
          >
            {preset.category}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-[#8a756b]">{preset.description}</p>
        <div className="mt-auto flex items-center justify-end pt-5">
          <button
            type="button"
            onClick={() => onApply(preset.id)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            適用する
          </button>
        </div>
      </div>
    </article>
  )
}

function UserStyleCard({
  style,
  highlighted,
  onApply,
}: {
  style: UserStyle
  highlighted: boolean
  onApply: (styleId: string) => void
}) {
  return (
    <article
      className={`flex flex-col rounded-[24px] border bg-white p-5 shadow-sm transition-all ${
        highlighted
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-[#f0e6df] hover:border-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9e6b47]">
            {style.referenceUrl ? 'Learned Style' : 'My Style'}
          </p>
          <h3 className="mt-2 text-lg font-black text-[#2d1f18]">{style.name}</h3>
        </div>
        <span className="rounded-full bg-[#fff1ea] px-3 py-1 text-[11px] font-bold text-primary">
          {style._count?.projects ?? 0}件で使用
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[#8a756b]">
        {style.description || '保存済みスタイル'}
      </p>

      <div className="mt-4 space-y-1 text-xs text-[#8a756b]">
        <p>更新日: {formatDate(style.updatedAt)}</p>
        {style.referenceUrl && (
          <p className="truncate">
            参照元: {style.sourceChannel || style.referenceUrl}
          </p>
        )}
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => onApply(style.id)}
          className="rounded-full border border-[#f0e6df] px-4 py-2 text-sm font-bold text-[#2d1f18] transition-colors hover:border-primary hover:text-primary"
        >
          このスタイルを使う
        </button>
      </div>
    </article>
  )
}

function StylesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const projectId = searchParams.get('projectId')
  const initialYoutubeUrl = searchParams.get('youtubeUrl') || ''
  const highlightStyleId = searchParams.get('highlightStyleId')
  const learned = searchParams.get('learned') === '1'

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl)
  const [error, setError] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    setYoutubeUrl(initialYoutubeUrl)
  }, [initialYoutubeUrl])

  const { data, error: stylesError } = useSWR(
    session?.user ? '/api/styles' : null,
    loadStyles,
    {
      revalidateOnFocus: false,
    },
  )

  const filteredPresets = useMemo(() => {
    return STYLE_PRESETS.filter((preset) => {
      const matchesCategory =
        selectedCategory === 'すべて' || preset.category === selectedCategory
      const searchableText = `${preset.name} ${preset.description} ${preset.category}`.toLowerCase()
      const matchesQuery = query.length === 0 || searchableText.includes(query.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [query, selectedCategory])

  const filteredUserStyles = useMemo(() => {
    const styles = data?.styles ?? []
    if (!query) {
      return styles
    }

    return styles.filter((style) => {
      const searchableText = `${style.name} ${style.description || ''} ${style.sourceChannel || ''}`.toLowerCase()
      return searchableText.includes(query.toLowerCase())
    })
  }, [data?.styles, query])

  async function applyProjectStyle(styleId: string) {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ styleId }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || 'プロジェクトへのスタイル適用に失敗しました')
    }
  }

  async function handleApplyPreset(presetId: string) {
    if (!projectId) {
      router.push('/home')
      return
    }

    setError('')
    setIsApplying(true)

    try {
      await postJson('/api/styles/preset', { projectId, presetId })
      await startProjectProcessing(projectId, { reuseExistingSubtitles: true })
      router.push(`/edit/${projectId}`)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'スタイル適用に失敗しました')
    } finally {
      setIsApplying(false)
    }
  }

  async function handleApplyUserStyle(styleId: string) {
    if (!projectId) {
      router.push('/home')
      return
    }

    setError('')
    setIsApplying(true)

    try {
      await applyProjectStyle(styleId)
      await startProjectProcessing(projectId, { reuseExistingSubtitles: true })
      router.push(`/edit/${projectId}`)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'スタイル適用に失敗しました')
    } finally {
      setIsApplying(false)
    }
  }

  function handleLearnStyle() {
    setError('')

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=%2Fstyles')
      return
    }

    if (!youtubeUrl || !z.url().safeParse(youtubeUrl).success) {
      setError('有効な YouTube URL を入力してください')
      return
    }

    const nextUrl =
      '/style-analysis?referenceUrl=' +
      encodeURIComponent(youtubeUrl) +
      (projectId ? `&projectId=${encodeURIComponent(projectId)}` : '')

    router.push(nextUrl)
  }

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <Header currentPage="styles" />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 md:px-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                {projectId ? 'Style Selection' : 'My Styles'}
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#2d1f18]">
                {projectId ? '編集スタイルを選ぶ' : 'マイスタイル'}
              </h1>
              <p className="mt-2 text-sm text-[#8a756b]">
                {projectId
                  ? 'アップロードした動画に適用するスタイルを選択します。'
                  : '保存済みスタイルの管理と、指定 YouTube からのスタイル学習ができます。'}
              </p>
            </div>
            <SearchBar value={query} onChange={setQuery} />
          </div>

          {learned && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-[#6b584b]">
              新しいスタイルを保存しました。マイスタイルからいつでも再利用できます。
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <nav className="flex min-w-max gap-6 border-b border-[#f0e6df]">
              <a href="#presets" className="border-b-2 border-primary pb-3 text-sm font-bold text-primary">
                プリセット
              </a>
              <a href="#my-styles" className="pb-3 text-sm font-medium text-[#8a756b] transition-colors hover:text-primary">
                マイスタイル
              </a>
              <a href="#learn" className="pb-3 text-sm font-medium text-[#8a756b] transition-colors hover:text-primary">
                URLから学習
              </a>
            </nav>
          </div>

          <section id="presets" className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {presetCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'border border-[#f0e6df] bg-white text-[#8a756b] hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onApply={(presetId) => {
                    void handleApplyPreset(presetId)
                  }}
                />
              ))}
            </div>

            {filteredPresets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#f0e6df] bg-white px-5 py-10 text-center text-sm text-[#8a756b]">
                条件に一致するプリセットがありません。
              </div>
            )}
          </section>

          <section id="my-styles" className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#2d1f18]">マイスタイル</h2>
                <p className="mt-1 text-sm text-[#8a756b]">
                  学習済みの YouTuber スタイルや保存済みスタイルを再利用できます。
                </p>
              </div>
              {!projectId && (
                <Link
                  href="/home"
                  className="rounded-full border border-[#f0e6df] bg-white px-4 py-2 text-sm font-bold text-[#2d1f18] transition-colors hover:border-primary hover:text-primary"
                >
                  動画をアップロード
                </Link>
              )}
            </div>

            {!session?.user ? (
              <div className="rounded-2xl border border-[#f0e6df] bg-white px-5 py-6 text-sm text-[#8a756b]">
                ログインすると、学習済みスタイルをここで管理できます。{' '}
                <Link href="/auth/signin?callbackUrl=%2Fstyles" className="font-bold text-primary">
                  ログインへ
                </Link>
              </div>
            ) : stylesError ? (
              <div className="rounded-2xl border border-[#f0e6df] bg-white px-5 py-6 text-sm text-[#8a756b]">
                {stylesError.message === 'ログインが必要です' ? (
                  <>
                    ログインすると、保存済みスタイルをここで管理できます。{' '}
                    <Link href="/auth/signin?callbackUrl=%2Fstyles" className="font-bold text-primary">
                      ログインへ
                    </Link>
                  </>
                ) : (
                  stylesError.message
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredUserStyles.map((style) => (
                  <UserStyleCard
                    key={style.id}
                    style={style}
                    highlighted={style.id === highlightStyleId}
                    onApply={(styleId) => {
                      void handleApplyUserStyle(styleId)
                    }}
                  />
                ))}
              </div>
            )}

            {!stylesError && filteredUserStyles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#f0e6df] bg-white px-5 py-10 text-center text-sm text-[#8a756b]">
                まだ保存済みスタイルはありません。下の URL 学習から好きな YouTuber を登録できます。
              </div>
            )}
          </section>

          <section id="learn" className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-[#2d1f18]">URLからスタイル学習</h2>
              <p className="mt-1 text-sm text-[#8a756b]">
                指定した YouTube 動画を分析して、マイスタイルとして保存します。
              </p>
            </div>

            <div className="rounded-[28px] border border-[#f0e6df] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="min-w-0 flex-1 rounded-2xl border border-[#f0e6df] bg-[#fffaf5] px-4 py-4 text-sm text-[#2d1f18] outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleLearnStyle}
                  disabled={isApplying}
                  className="rounded-2xl bg-[#1c130d] px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-primary disabled:opacity-50"
                >
                  スタイルを学習する
                </button>
              </div>
              <p className="mt-3 text-xs text-[#8a756b]">
                指定 YouTuber の字幕傾向、カットテンポ、色味を抽出して保存します。
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function StylesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fffaf5]">
          <Header currentPage="styles" />
          <div className="flex min-h-[70vh] items-center justify-center pt-24">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span>
              <p className="mt-4 text-sm text-[#8a756b]">読み込み中...</p>
            </div>
          </div>
        </div>
      }
    >
      <StylesPageContent />
    </Suspense>
  )
}
