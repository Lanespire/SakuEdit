'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { postJson } from '@/lib/client/http'
import { startProjectProcessing } from '@/lib/client/project-processing'

type AnalysisResponse = {
  success: boolean
  projectId: string
  styleId: string
  message: string
}

const analysisSteps = [
  {
    id: 'download',
    title: '参考動画を取得',
    description: 'YouTube の動画情報と音声を解析しています。',
  },
  {
    id: 'transcript',
    title: '字幕と話し方を抽出',
    description: '発話テンポ、間、字幕スタイルの傾向を収集中です。',
  },
  {
    id: 'visual',
    title: 'カットと色味を分析',
    description: '映像のリズム、色味、構図の特徴を学習しています。',
  },
  {
    id: 'save',
    title: 'スタイルを保存',
    description: 'マイスタイルとして再利用できる形にまとめています。',
  },
] as const

function StyleAnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const referenceUrl = searchParams.get('referenceUrl') || ''

  const [progress, setProgress] = useState(6)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  const activeStepIndex = useMemo(() => {
    if (progress >= 90) return 3
    if (progress >= 65) return 2
    if (progress >= 35) return 1
    return 0
  }, [progress])

  useEffect(() => {
    if (!referenceUrl) {
      setError('参考動画 URL が見つかりません')
      return
    }

    let cancelled = false
    const intervalId = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current
        }
        return Math.min(92, current + Math.random() * 8 + 4)
      })
    }, 1200)

    async function runAnalysis() {
      try {
        const result = await postJson<AnalysisResponse, { projectId?: string; referenceUrl: string }>(
          '/api/analyze',
          {
            ...(projectId ? { projectId } : {}),
            referenceUrl,
          },
        )

        if (cancelled) {
          return
        }

        setProgress(100)
        setCompleted(true)

        if (projectId) {
          await startProjectProcessing(result.projectId, { reuseExistingSubtitles: true })
          router.replace(`/processing/${result.projectId}`)
          return
        }

        router.replace(`/styles?learned=1&highlightStyleId=${encodeURIComponent(result.styleId)}`)
      } catch (analysisError) {
        if (!cancelled) {
          setError(
            analysisError instanceof Error
              ? analysisError.message
              : 'スタイル分析に失敗しました',
          )
        }
      } finally {
        window.clearInterval(intervalId)
      }
    }

    void runAnalysis()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [projectId, referenceUrl, router])

  return (
    <div className="min-h-screen bg-[#23170f] text-white">
      <header className="border-b border-[#3a2e26] bg-[#231810]/95 px-4 py-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={projectId ? `/styles?projectId=${encodeURIComponent(projectId)}` : '/styles'}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Style Analysis
              </p>
              <h1 className="text-lg font-bold">スタイルを学習中...</h1>
            </div>
          </div>

          <Link
            href={projectId ? '/projects' : '/styles'}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:px-6">
        <section className="md:w-[44%]">
          <div className="rounded-[28px] border border-[#3a2e26] bg-[#2a1d15] p-5 shadow-xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a2e26] to-[#111827]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,116,21,0.3),_transparent_45%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-3xl text-white">play_arrow</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                  YouTube
                </span>
                {projectId && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    動画へ適用予定
                  </span>
                )}
              </div>

              <p className="break-all text-sm text-white/75">{referenceUrl}</p>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                  学習内容
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li>字幕フォント・サイズ・配置</li>
                  <li>カットテンポと無音処理</li>
                  <li>色味と画面構成の傾向</li>
                  <li>保存後にマイスタイルから再利用可能</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <div className="rounded-[28px] border border-[#3a2e26] bg-[#2a1d15] p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                  auto_awesome
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black">AI がスタイルを解析しています</h2>
                <p className="mt-1 text-sm text-white/60">
                  {completed ? '完了しました。次の画面へ移動します。' : `${Math.round(progress)}% 完了`}
                </p>
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#ffb57c] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-8 space-y-3">
              {analysisSteps.map((step, index) => {
                const isCompleted = progress >= 100 || index < activeStepIndex
                const isActive = !isCompleted && index === activeStepIndex && !error

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : isActive
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`material-symbols-outlined ${
                          isCompleted
                            ? 'text-emerald-300'
                            : isActive
                              ? 'animate-spin text-primary'
                              : 'text-white/25'
                        }`}
                      >
                        {isCompleted ? 'check_circle' : isActive ? 'sync' : 'circle'}
                      </span>
                      <div>
                        <p className="font-bold text-white">{step.title}</p>
                        <p className="mt-1 text-sm text-white/60">{step.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <p className="font-bold">スタイル分析に失敗しました</p>
                <p className="mt-1">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={projectId ? `/styles?projectId=${encodeURIComponent(projectId)}` : '/styles'}
                    className="rounded-full bg-white px-4 py-2 font-bold text-[#23170f]"
                  >
                    スタイル選択へ戻る
                  </Link>
                  <Link
                    href="/home"
                    className="rounded-full border border-white/15 px-4 py-2 font-bold text-white"
                  >
                    ホームへ戻る
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default function StyleAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#23170f] text-white">
          <div className="flex min-h-screen items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary">sync</span>
          </div>
        </div>
      }
    >
      <StyleAnalysisContent />
    </Suspense>
  )
}
