'use client'

import Image from 'next/image'
import Link from 'next/link'
import { z } from 'zod'
import { Header } from '@/components/layout'
import { useSWR } from '@/lib/client/swr'
import { getProjectDisplayStatus } from '@/lib/project-status'
import {
  useProjectsFilterStore,
  type ProjectsFilter,
} from '@/lib/stores/projects-filter-store'

export interface ProjectsBillingSummary {
  planDisplayName: string
  usedMinutes: number
  totalMinutes: number
  remainingMinutes: number
  usagePercentage: number
  resetDateLabel: string
}

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  progress: z.number().nullable().optional(),
  lastError: z.string().nullable().optional(),
  selectedThumbnailId: z.string().nullable().optional(),
  updatedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()),
  style: z
    .object({
      name: z.string(),
    })
    .nullable()
    .optional(),
  videos: z.array(
    z.object({
      duration: z.number().nullable().optional(),
      thumbnailUrl: z.string().nullable().optional(),
    }),
  ),
  _count: z
    .object({
      subtitles: z.number(),
    })
    .optional(),
})

type Project = z.infer<typeof projectSchema>

const projectsResponseSchema = z.object({
  projects: z.array(projectSchema),
})

const filterOptions: Array<{
  value: ProjectsFilter
  label: string
  icon: string
}> = [
  { value: 'ALL', label: '全て', icon: 'grid_view' },
  { value: 'PROCESSING', label: '処理中', icon: 'edit_note' },
  { value: 'COMPLETED', label: '完了済み', icon: 'check_circle' },
  { value: 'ERROR', label: 'エラー', icon: 'error' },
]

const previewGradients = [
  'from-[#efe2c6] to-[#e8dbc0]',
  'from-[#d8deec] to-[#cfd7e8]',
  'from-[#d6e5dc] to-[#cfe1d8]',
  'from-[#ecdde2] to-[#ead6dd]',
  'from-[#ece0d5] to-[#e6d5c7]',
  'from-[#dae8e5] to-[#d4e1df]',
]

function formatDuration(seconds?: number | null) {
  if (!seconds) {
    return '--:--'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function formatDate(value: string | Date | undefined) {
  if (!value) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatMinutes(value: number) {
  return new Intl.NumberFormat('ja-JP').format(value)
}

function getProjectHref(project: Project) {
  return `/edit/${project.id}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: '完了',
        className: 'bg-emerald-500 text-white',
      }
    case 'ERROR':
      return {
        label: 'エラー',
        className: 'bg-red-500 text-white',
      }
    case 'DRAFT':
      return {
        label: '下書き',
        className: 'bg-slate-500 text-white',
      }
    default:
      return {
        label: '処理中',
        className: 'bg-amber-500 text-white',
      }
  }
}

function getProjectActionLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return '編集'
    case 'ERROR':
      return '確認'
    default:
      return '再開'
  }
}

function getNormalizedStatus(project: Project) {
  return getProjectDisplayStatus({
    status: project.status,
    progress: project.progress,
    lastError: project.lastError,
  })
}

async function loadProjects(url: string) {
  const response = await fetch(url)

  if (response.status === 401) {
    throw new Error('ログインが必要です')
  }

  if (!response.ok) {
    throw new Error('プロジェクト一覧の取得に失敗しました')
  }

  return projectsResponseSchema.parse(await response.json())
}

function BillingCard({ billingSummary }: { billingSummary: ProjectsBillingSummary | null }) {
  if (!billingSummary) {
    return (
      <div className="rounded-[22px] border border-[#e9d9ce] bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#9e6b47]">
          アカウント状況
        </h3>
        <p className="text-sm leading-6 text-[#6b584b]">
          ログインすると、残りクレジットを実データで確認できます。
        </p>
        <Link
          href="/auth/signin?callbackUrl=%2Fprojects"
          className="mt-4 inline-flex rounded-full bg-[#1c130d] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary"
        >
          ログイン
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-[22px] border border-[#e9d9ce] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#9e6b47]">
            アカウント状況
          </h3>
          <p className="mt-2 text-sm font-semibold text-[#1c130d]">
            {billingSummary.planDisplayName}プラン
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          次回更新 {billingSummary.resetDateLabel}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#9e6b47]">残りクレジット</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-[#1c130d]">
                {formatMinutes(billingSummary.remainingMinutes)}
                <span className="ml-1 text-base font-bold text-[#6b584b]">分</span>
              </p>
            </div>
            <p className="text-xs font-semibold text-[#6b584b]">
              合計 {formatMinutes(billingSummary.totalMinutes)}分
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6b584b]">
            <span>使用済み時間</span>
            <span>
              {formatMinutes(billingSummary.usedMinutes)}/{formatMinutes(billingSummary.totalMinutes)}分
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f4ece6]">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${billingSummary.usagePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-[#e9d9ce] bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f7efe8]">
        <span className="material-symbols-outlined text-[34px] text-[#9e6b47]">video_library</span>
      </div>
      <h3 className="text-2xl font-black text-[#1c130d]">プロジェクトがありません</h3>
      <p className="mt-2 text-sm text-[#6b584b]">新しいプロジェクトを作成して始めましょう</p>
      <Link
        href="/home"
        className="mt-6 inline-flex rounded-full bg-[#1c130d] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary"
      >
        新規プロジェクトを作成
      </Link>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[24px] border border-[#e9d9ce] bg-white shadow-sm"
        >
          <div className="aspect-video animate-pulse bg-[#f4ece6]" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#f4ece6]" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#f4ece6]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
      <p className="text-lg font-semibold">プロジェクトを読み込めませんでした</p>
      <p className="mt-2 text-sm">{message}</p>
      {message === 'ログインが必要です' && (
        <Link
          href="/auth/signin?callbackUrl=%2Fprojects"
          className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          ログイン
        </Link>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const normalizedStatus = getNormalizedStatus(project)
  const statusBadge = getStatusBadge(normalizedStatus)
  const primaryVideo = project.videos[0]
  const footerLabel = project.style?.name ?? 'スタイル未設定'
  const actionLabel = getProjectActionLabel(normalizedStatus)
  const gradient = previewGradients[index % previewGradients.length]

  // 代表サムネイル: selectedThumbnailId 優先、なければ video.thumbnailUrl
  const thumbnailSrc = project.selectedThumbnailId
    ? `/api/thumbnail/generated/${project.selectedThumbnailId}`
    : primaryVideo?.thumbnailUrl ?? null

  // サムネイルもない場合、ソース動画の最初のフレームを表示
  const videoPreviewSrc = !thumbnailSrc ? `/api/projects/${project.id}/source-video` : null

  return (
    <Link
      href={getProjectHref(project)}
      className="group overflow-hidden rounded-[24px] border border-[#e9d9ce] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden border-b border-[#f6ede7]">
        {thumbnailSrc ? (
          <Image
            src={thumbnailSrc}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : videoPreviewSrc ? (
          <video
            src={videoPreviewSrc}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
            <span className="text-sm font-bold text-[#9e6b47]/60">No Image</span>
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>

        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          {formatDuration(primaryVideo?.duration)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xl font-black leading-tight text-[#1c130d] transition-colors group-hover:text-primary">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#9e6b47]">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>{formatDate(project.updatedAt ?? project.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#f6ede7] pt-3">
          <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#9e6b47]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fff2ea] text-[10px] text-primary">
              ●
            </span>
            <span className="truncate">{footerLabel}</span>
            {project._count?.subtitles !== undefined && <span>字幕 {project._count.subtitles}</span>}
          </div>

          <span
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              normalizedStatus === 'COMPLETED'
                ? 'bg-[#1c130d] text-white group-hover:bg-primary'
                : 'border border-[#ead9cd] text-[#6b584b] group-hover:border-primary group-hover:text-primary'
            }`}
          >
            {actionLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ProjectsDashboardClient({
  billingSummary,
}: {
  billingSummary: ProjectsBillingSummary | null
}) {
  const status = useProjectsFilterStore((state) => state.status)
  const setStatus = useProjectsFilterStore((state) => state.setStatus)
  const { data, error, isLoading } = useSWR('/api/projects', loadProjects, {
    revalidateOnFocus: false,
  })

  const projects = (data?.projects ?? []).filter((project) => {
    if (status === 'ALL') {
      return true
    }

    return getNormalizedStatus(project) === status
  })

  return (
    <div className="min-h-screen bg-background-light">
      <Header currentPage="history" />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-24 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full shrink-0 space-y-8 md:w-64">
            <div className="space-y-4">
              <h1 className="px-2 text-[32px] font-black tracking-tight text-[#1c130d]">
                マイプロジェクト
              </h1>

              <nav className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
                {filterOptions.map((option) => {
                  const isActive = option.value === status

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors md:w-full ${
                        isActive
                          ? 'bg-[#f4e2d4] text-primary'
                          : 'text-[#6b584b] hover:bg-[#f8efe8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="hidden md:block">
              <BillingCard billingSummary={billingSummary} />
            </div>
          </aside>

          <section className="min-w-0 flex-1 space-y-6">
            <div className="md:hidden">
              <BillingCard billingSummary={billingSummary} />
            </div>

            <Link
              href="/home"
              className="group flex h-16 w-full items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-[#e9d9ce] bg-white px-5 text-lg font-black text-[#1c130d] transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </span>
              <span>新規プロジェクトを作成</span>
            </Link>

            {error ? (
              <ErrorState message={error.message} />
            ) : isLoading ? (
              <LoadingState />
            ) : projects.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
