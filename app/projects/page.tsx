'use client'

import Link from 'next/link'
import { z } from 'zod'
import { useSWR } from '@/lib/client/swr'
import {
  useProjectsFilterStore,
  type ProjectsFilter,
} from '@/lib/stores/projects-filter-store'

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
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

const projectsResponseSchema = z.object({
  projects: z.array(projectSchema),
})

const filterOptions: Array<{ value: ProjectsFilter; label: string }> = [
  { value: 'ALL', label: 'すべて' },
  { value: 'PROCESSING', label: '処理中' },
  { value: 'COMPLETED', label: '完了' },
  { value: 'ERROR', label: 'エラー' },
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

function getProjectHref(project: z.infer<typeof projectSchema>) {
  return project.status === 'COMPLETED'
    ? `/edit/${project.id}`
    : `/processing/${project.id}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: '完成',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      }
    case 'ERROR':
      return {
        label: 'エラー',
        className: 'bg-red-500/15 text-red-700 dark:text-red-300',
      }
    default:
      return {
        label: '処理中',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      }
  }
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

export default function ProjectsPage() {
  const status = useProjectsFilterStore((state) => state.status)
  const setStatus = useProjectsFilterStore((state) => state.setStatus)
  const query = status === 'ALL' ? '/api/projects' : `/api/projects?status=${status}`
  const { data, error, isLoading } = useSWR(query, loadProjects, {
    revalidateOnFocus: false,
  })

  const projects = data?.projects ?? []

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SakuEdit
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/home"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                + 新規作成
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">プロジェクト</h1>
            <p className="text-muted">過去の編集プロジェクトを管理</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = option.value === status
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <p className="text-lg font-semibold">プロジェクトを読み込めませんでした</p>
            <p className="mt-2 text-sm">{error.message}</p>
            {error.message === 'ログインが必要です' && (
              <Link
                href="/auth/signin?callbackUrl=%2Fprojects"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                ログイン
              </Link>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="aspect-video animate-pulse bg-surface-hover" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-surface-hover" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-surface-hover" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">プロジェクトがありません</h3>
            <p className="text-muted mb-6">新しいプロジェクトを作成して始めましょう</p>
            <Link
              href="/home"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              + 新規作成
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((project) => {
              const statusBadge = getStatusBadge(project.status)
              const primaryVideo = project.videos[0]

              return (
                <Link
                  key={project.id}
                  href={getProjectHref(project)}
                  className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary transition-all group"
                >
                  <div className="aspect-video bg-surface-hover flex items-center justify-center overflow-hidden">
                    {primaryVideo?.thumbnailUrl ? (
                      <img
                        src={primaryVideo.thumbnailUrl}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-16 h-16 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="font-bold group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                      <span>{formatDuration(primaryVideo?.duration)}</span>
                      <span>{formatDate(project.updatedAt ?? project.createdAt)}</span>
                      {project.style?.name && <span>{project.style.name}</span>}
                      {project._count?.subtitles !== undefined && (
                        <span>字幕 {project._count.subtitles}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
