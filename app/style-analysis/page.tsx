'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalysisStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'processing' | 'pending'
}

export default function StyleAnalysisPage() {
  const router = useRouter()

  const [progress, setProgress] = useState(0)

  const steps: AnalysisStep[] = [
    {
      id: '1',
      title: '字幕スタイルを検出',
      description: '白文字 + 黒縁取り、 画面下部, バウンスアニメーション',
      status: 'completed',
    },
    {
      id: '2',
      title: 'カットのテンポを分析',
      description: '平均シーン長: 3.2秒、ジャンプカット多用',
      status: 'completed',
    },
    {
      id: '3',
      title: 'テロップパターンを学習',
      description: '強調ワード: 黄色ハイライト, 効果音連動',
      status: 'completed',
    },
    {
      id: '4',
      title: 'BGM/SE傾向を分析中...',
      description: 'アップテンポ、 場面転換でSE...',
      status: 'processing',
    },
    {
      id: '5',
      title: 'サムネイル構図を分析...',
      description: '顔の配置、 写真とテキストの比率',
      status: 'pending',
    },
  ]

  // Simulate analysis progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            router.push('/edit/new-project')
          }, 1000)
          return 100
        }
        return prev + Math.random() * 5 + 2
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [router])

  const handleBack = () => {
    router.push('/styles')
  }

  const handleClose = () => {
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
          <button
            onClick={handleBack}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            data-test-id="style-analysis-back-button"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">スタイルを学習中...</h1>
        </div>
        <button
          onClick={handleClose}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          data-test-id="style-analysis-close-button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left: Reference Video */}
        <div className="md:w-1/2 p-6 border-r border-[#4a3221]">
          <div
            className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4"
            data-test-id="style-analysis-video-preview"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="size-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
              </button>
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded">YouTuber</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded">Vlog</span>
            </div>
            <h2 className="text-white font-bold text-lg">
              【参考動画】東京旅行VLOG #1
            </h2>
            <div className="flex items-center gap-3">
              <div className="size-8 bg-gradient-to-br from-primary to-orange-400 rounded-full"></div>
              <span className="text-white/70 text-sm">Sample Creator</span>
              <span className="text-white/40 text-xs">1.2M subscribers</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white/5 rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              <p className="text-white/60 text-xs">
                この動画の編集スタイルをAIが分析しています
              </p>
            </div>
          </div>
        </div>

        {/* Right: Analysis Progress */}
        <div className="md:w-1/2 p-6 flex flex-col">
          {/* Processing Indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl animate-spin">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-bold text-white">スタイル分析中</h3>
              <p className="text-white/50 text-sm">{Math.round(progress)}% 完了</p>
            </div>
          </div>

          {/* Analysis Steps */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-colors ${
                  step.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                  step.status === 'processing' ? 'bg-primary/10 border-primary/30' :
                  'bg-white/5 border-white/10'
                }`}
                data-test-id={`style-analysis-step-${step.id}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm ${
                      step.status === 'pending' ? 'text-white/40' : 'text-white'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      step.status === 'pending' ? 'text-white/30' : 'text-white/60'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Learned Style Preview */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              学習したスタイル概要
            </h3>

            {/* Subtitle Preview */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10" data-test-id="style-analysis-subtitle-preview">
              <p className="text-xs text-white/50 mb-2">字幕プレビュー</p>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"></div>
                <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                  <p className="inline-block px-3 py-1 bg-black/70 rounded text-white text-sm font-bold">
                    サンプル字幕
                  </p>
                </div>
              </div>
            </div>

            {/* Tempo Chart */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10" data-test-id="style-analysis-tempo-chart">
              <p className="text-xs text-white/50 mb-2">カットテンポ</p>
              <div className="flex items-end gap-1 h-12">
                {[40, 60, 30, 80, 45, 70, 50, 60, 35, 55].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/60 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2">平均シーン長: 3.2秒</p>
            </div>

            {/* Color Palette */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10" data-test-id="style-analysis-color-palette">
              <p className="text-xs text-white/50 mb-2">抽出カラーパレット</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="h-8 bg-primary rounded mb-1"></div>
                  <p className="text-xs text-white/50 text-center">強調</p>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-yellow-500 rounded mb-1"></div>
                  <p className="text-xs text-white/50 text-center">ツッコミ</p>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-blue-500 rounded mb-1"></div>
                  <p className="text-xs text-white/50 text-center">ベース</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
