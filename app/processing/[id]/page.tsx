'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface ProcessingStep {
  id: string
  title: string
  status: 'completed' | 'processing' | 'pending'
  subSteps?: { title: string; status: 'completed' | 'processing' | 'pending' }[]
}

interface LogEntry {
  id: string
  timestamp: string
  animation: string
  text: string
}

interface ProjectData {
  id: string
  name: string
  status: string
  progress: number
  progressMessage: string
  lastError?: string | null
  videos: Array<{
    id: string
    filename: string
    duration: number
  }>
  style?: {
    name: string
  }
}

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const _projectId = params.id as string

  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: '1', title: '動画を読み込み', status: 'pending' },
    { id: '2', title: '音声から字幕を生成', status: 'pending' },
    { id: '3', title: 'スタイルを適用', status: 'pending' },
    { id: '4', title: '無音区間をカット', status: 'pending' },
    { id: '5', title: '最終レンダリング', status: 'pending' },
  ])
  const [projectName, setProjectName] = useState('')
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState('')

  const updateStepStatuses = useCallback((progress: number, status: string, message?: string) => {
    setSteps((prev) => {
      const completedStepIndex = Math.floor(progress / 20) // 5 steps, each 20%

      return prev.map((step, index) => {
        if (status === 'ERROR') {
          return { ...step, status: 'pending' }
        }

        if (status === 'COMPLETED') {
          return { ...step, status: 'completed' }
        }

        if (index < completedStepIndex) {
          return { ...step, status: 'completed' }
        }

        if (index === completedStepIndex) {
          return { ...step, status: 'processing' }
        }

        return { ...step, status: 'pending' }
      })
    })

    if (message && progress > 0) {
      setLogs((prev) => {
        const lastLog = prev[prev.length - 1]
        if (lastLog?.text === message) {
          return prev
        }

        const animationTypes = ['FadeIn', 'Bounce', 'Slide', 'Plain', 'Pop']
        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          animation: animationTypes[Math.floor(Math.random() * animationTypes.length)],
          text: message,
        }

        return [...prev.slice(-4), newLog]
      })
    }
  }, [])

  // Fetch project progress
  useEffect(() => {
    if (!_projectId) return

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/projects/${_projectId}`)
        if (!res.ok) {
          throw new Error('Failed to fetch project')
        }
        const data = await res.json()
        const project: ProjectData = data.project

        setProjectName(project.name)
        setProgress(project.progress)

        // Update step statuses based on progress
        updateStepStatuses(project.progress, project.status, project.progressMessage)

        // Handle completion
        if (project.status === 'COMPLETED') {
          setTimeout(() => {
            router.push(`/edit/${_projectId}`)
          }, 1000)
          return
        }

        // Handle error
        if (project.status === 'ERROR') {
          setIsError(true)
          setError(project.lastError || project.progressMessage || '処理中にエラーが発生しました')
          return
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
        setIsError(true)
        setError('進捗の取得に失敗しました')
      }
    }

    fetchProgress()
    const interval = setInterval(fetchProgress, 2000)

    return () => clearInterval(interval)
  }, [_projectId, router, updateStepStatuses])

  const handleCancel = () => {
    router.push('/home')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="material-symbols-outlined text-green-400">check_circle</span>
      case 'processing':
        return <span className="material-symbols-outlined text-primary animate-spin">sync</span>
      case 'pending':
        return <span className="material-symbols-outlined text-white/30">circle</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-display">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#4a3221] bg-[#231810]">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white">movie_edit</span>
          </div>
          <h1 className="text-lg font-bold">{projectName || '動画処理中...'}</h1>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          data-test-id="processing-cancel-button"
        >
          キャンセル
        </button>
      </header>

      {/* Error Display */}
      {isError && (
        <div className="max-w-5xl mx-auto mt-8 px-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
            <h2 className="text-xl font-bold mb-2">処理エラー</h2>
            <p className="text-white/70 mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg font-bold"
              >
                再試行
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <main className="flex flex-col md:flex-row min-h-[calc(100vh-73px)] opacity-30 pointer-events-none">
          {/* Placeholder for disabled state */}
        </main>
      )}

      {/* Main Content */}
      <main className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
        {/* Left: Video Preview */}
        <div className="md:w-[55%] p-6 flex flex-col" data-test-id="processing-video-preview">
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden min-h-[300px]">
            {/* Video frame */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>

            {/* Processing badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full">
                <span className="material-symbols-outlined text-white text-sm animate-pulse">sync</span>
                <span className="text-white text-xs font-bold">プレビュー（処理中）</span>
              </div>
            </div>

            {/* Subtitle overlay */}
            <div className="absolute bottom-8 left-0 right-0 text-center px-4">
              <div className="inline-block px-4 py-2 bg-black/70 rounded-lg">
                <p className="text-white text-lg font-bold">サンプル字幕テキスト</p>
              </div>
            </div>

            {/* Face detection simulation */}
            <div className="absolute top-1/3 left-1/4 w-24 h-24 border-2 border-primary/50 rounded-lg"></div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Time display */}
            <div className="absolute bottom-4 right-4 text-xs font-mono text-white/70">
              {Math.floor(progress * 2.25 / 60)}:{String(Math.floor(progress * 2.25 % 60)).padStart(2, '0')} / 3:45
            </div>
          </div>

          <p className="text-xs text-white/40 mt-2 text-center">
            ※プレビューは実際の処理速度より低画質で表示されます
          </p>
        </div>

        {/* Right: Status & Steps */}
        <div className="md:w-[45%] p-6 border-l border-[#4a3221] flex flex-col">
          {/* Progress Section */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-[#2c1e16] rounded-xl" data-test-id="processing-percentage-display">
            {/* Circular progress */}
            <div className="relative size-20">
              <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#f97415"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progress} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded">Processing</span>
              </div>
              <p className="text-sm text-white/70">あなたの動画にスタイルを適用中...</p>
              <p className="text-xs text-white/40 mt-1">残り時間: 約{Math.max(1, Math.round((100 - progress) / 20))}分</p>
            </div>
          </div>

          {/* Applied Style Card */}
          <div className="p-4 bg-[#2c1e16] rounded-xl mb-6 border border-white/5" data-test-id="processing-style-card">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-primary to-orange-400 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white">auto_awesome</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">AI処理中</p>
                <p className="text-xs text-white/50">字幕生成・スタイル適用・無音カット</p>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="flex-1 overflow-y-auto" data-test-id="processing-steps">
            <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              処理ステップ
            </h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <span className={`text-sm ${step.status === 'pending' ? 'text-white/40' : 'text-white'}`}>
                      {step.title}
                    </span>
                  </div>
                  {step.subSteps && (
                    <div className="mt-2 ml-8 space-y-1">
                      {step.subSteps.map((subStep, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {getStatusIcon(subStep.status)}
                          <span className={subStep.status === 'pending' ? 'text-white/40' : 'text-white/70'}>
                            {subStep.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Log */}
          <div className="mt-4 p-3 bg-[#1a110a] rounded-xl border border-white/5" data-test-id="processing-live-log">
            <h4 className="text-xs font-bold text-white/50 mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">terminal</span>
              Live Log
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-xs">
                  <span className="text-white/30 font-mono">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    log.animation === 'FadeIn' ? 'bg-blue-500/20 text-blue-300' :
                    log.animation === 'Bounce' ? 'bg-green-500/20 text-green-300' :
                    log.animation === 'Slide' ? 'bg-purple-500/20 text-purple-300' :
                    log.animation === 'Pop' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {log.animation}
                  </span>
                  <span className="text-white/70 truncate">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
