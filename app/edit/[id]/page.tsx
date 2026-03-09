'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SubtitleEditModal from '@/app/components/SubtitleEditModal'
import ExportModal from '@/app/components/ExportModal'

interface Subtitle {
  id: string
  text: string
  startTime?: number  // DB field name
  endTime?: number    // DB field name
  start?: number     // UI field (milliseconds)
  end?: number       // UI field (milliseconds)
  style?: string
  position?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string | null
  isBold?: boolean
  highlight?: boolean
  width?: string
}

interface AISuggestion {
  id: string
  type: string
  title: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
  recommended: boolean
  isApplied?: boolean
}

interface VideoClip {
  id: string
  name?: string
  filename?: string
  width?: string
  start?: number
  storagePath?: string | null
  duration?: number
}

interface ProjectData {
  id: string
  name: string
  status: string
  videos: VideoClip[]
  subtitles: Subtitle[]
  aiSuggestions: AISuggestion[]
  style?: {
    name: string
  }
}

export default function EditPage() {
  const params = useParams()
  const router = useRouter()
  const _projectId = params.id as string

  const [activeTab, setActiveTab] = useState<'ai' | 'subtitle' | 'cut' | 'style'>('ai')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState(0)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // AI Suggestions
  const aiSuggestions: AISuggestion[] = projectData?.aiSuggestions || [
    {
      id: '1',
      type: 'silence_cut',
      title: '無音カット',
      description: '8箇所の無音エリアを検出しました。適用すると動画全体を 32秒 短縮できます。',
      icon: 'content_cut',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      recommended: true,
    },
    {
      id: '2',
      type: 'tempo_optimize',
      title: 'テンポ最適化',
      description: 'YouTuber風のテンポに合わせて、間延びしたシーンを自動調整します。',
      icon: 'speed',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      recommended: false,
    },
    {
      id: '3',
      type: 'highlight',
      title: 'ハイライト検出',
      description: '音声の盛り上がりから、3箇所の重要なポイントを検出しました。',
      icon: 'star',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      recommended: false,
    },
  ]

  // Timeline clips (from DB videos)
  const videoClips: VideoClip[] = projectData?.videos?.map(v => ({
    id: v.id,
    name: v.name || v.filename || 'Video',
    width: '280px',
    start: v.start || 0,
  })) || []

  // Subtitles (from DB)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])

  // Load project data
  useEffect(() => {
    if (!_projectId) return

    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${_projectId}`)
        if (!res.ok) {
          throw new Error('プロジェクトの読み込みに失敗しました')
        }
        const data = await res.json()
        const project: ProjectData = data.project

        setProjectData(project)

        // Convert DB subtitles to display format
        const displaySubtitles: Subtitle[] = project.subtitles.map((sub, index) => ({
          id: sub.id,
          text: sub.text,
          startTime: sub.startTime,
          endTime: sub.endTime,
          start: Math.round((sub.startTime ?? 0) * 1000), // Convert to ms
          end: Math.round((sub.endTime ?? 0) * 1000),
          style: sub.style,
          position: sub.position,
          fontSize: sub.fontSize,
          fontColor: sub.fontColor,
          backgroundColor: sub.backgroundColor,
          isBold: sub.isBold,
          highlight: false,
          width: estimateSubtitleWidth(sub.text),
        }))

        setSubtitles(displaySubtitles)
      } catch (err) {
        console.error('Error loading project:', err)
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [_projectId])

  // Estimate subtitle width for display
  const estimateSubtitleWidth = (text: string): string => {
    const avgCharWidth = 14 // pixels per character for Japanese text
    const width = Math.min(text.length * avgCharWidth, 300)
    return `${width}px`
  }

  const openSubtitleModal = (index: number) => {
    setSelectedSubtitleIndex(index)
    setIsSubtitleModalOpen(true)
  }

  const handleSaveSubtitle = (subtitle: Subtitle) => {
    setSubtitles(prev => prev.map((s, i) => i === selectedSubtitleIndex ? subtitle : s))
    setIsSubtitleModalOpen(false)
  }

  const handleDeleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id))
    setIsSubtitleModalOpen(false)
  }

  const handleExport = async (settings: {
    quality: string
    format: string
    subtitleOption: string
    removeWatermark: boolean
    exportThumbnail: boolean
  }) => {
    if (!_projectId) return

    setIsExporting(true)
    setIsExportModalOpen(false)

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: _projectId,
          quality: settings.quality,
          format: settings.format,
          subtitleOption: settings.subtitleOption,
          removeWatermark: settings.removeWatermark,
          exportThumbnail: settings.exportThumbnail,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || '書き出しに失敗しました')
      }

      const data = await res.json()

      // Start polling for export completion
      const checkExportStatus = async () => {
        try {
          const statusRes = await fetch(`/api/export/${_projectId}/${data.exportJob.id}`)
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            if (statusData.exportJob.status === 'COMPLETED') {
              // Download the video
              window.location.href = statusData.exportJob.videoUrl
            } else if (statusData.exportJob.status === 'FAILED') {
              throw new Error(statusData.exportJob.error || '書き出しに失敗しました')
            } else {
              // Still processing, check again
              setTimeout(checkExportStatus, 2000)
            }
          }
        } catch (err) {
          console.error('Error checking export status:', err)
          setError(err instanceof Error ? err.message : 'ステータス確認中にエラーが発生しました')
        }
      }

      checkExportStatus()
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background-dark text-white font-display overflow-hidden selection:bg-primary/30">
      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-primary animate-spin mb-4">sync</span>
            <p className="text-white/70">プロジェクトを読み込み中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
            <h2 className="text-2xl font-bold mb-2">エラーが発生しました</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg font-bold"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/home')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`flex shrink-0 items-center justify-between whitespace-nowrap border-b border-solid border-b-[#4a3221] px-6 py-3 bg-[#231810] z-20 ${isLoading || error ? 'hidden' : ''}`}>
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">movie_edit</span>
            </div>
            <div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-tight">
                SakuEdit
              </h2>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
              <p className="text-sm text-white/90 font-medium">{projectData?.name || 'プロジェクト'}</p>
              <span className="material-symbols-outlined text-white/50 text-sm group-hover:text-white">edit</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button
            className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            data-test-id="back-to-projects"
          >
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            <span className="hidden md:inline">マイプロジェクト</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            <span>保存済み</span>
          </div>
          <div className="relative group">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 ring-2 ring-white/10 hover:ring-primary/50 transition-all bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm" data-test-id="user-avatar">
              U
            </div>
            <div className="absolute right-0 top-0 size-3 bg-green-500 border-2 border-[#231810] rounded-full"></div>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex flex-col overflow-hidden relative ${isLoading || error ? 'hidden' : ''}`}>
        {/* Video Preview */}
        <div className="flex-shrink-0 bg-[#1a110a] py-6 px-4 flex justify-center border-b border-[#4a3221]">
          <div
            className="relative w-full max-w-[900px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group"
            data-test-id="video-preview"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-80"></div>

            {/* Style Badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/90 backdrop-blur-sm pl-3 pr-4 shadow-lg border border-white/10">
                <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
                <p className="text-white text-xs font-bold">{projectData?.style?.name || '編集中'}</p>
              </div>
            </div>

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                className="flex items-center justify-center rounded-full size-16 bg-black/60 text-white backdrop-blur-sm hover:bg-primary hover:scale-110 transition-all"
                data-test-id="play-button"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <span className="material-symbols-outlined text-4xl ml-1">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>

            {/* Video Controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-4 px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex h-4 items-center justify-center cursor-pointer group/scrubber">
                <div className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden relative">
                  <div
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: '37%' }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                  <button className="text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>
                  <button className="text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">volume_up</span>
                  </button>
                  <div className="text-white text-xs font-medium tracking-wide font-mono">
                    <span className="text-white">1:23</span>
                    <span className="text-white/50 mx-1">/</span>
                    <span className="text-white/50">3:45</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                  </button>
                  <button className="text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col bg-[#2c1e16] min-h-[300px] border-b border-[#4a3221]">
          <div className="flex items-center justify-between px-4 py-2 bg-[#231810] border-b border-[#4a3221]">
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">view_timeline</span>
              タイムライン
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/5 rounded-lg p-1">
                <button className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <div className="w-20 h-1 bg-white/10 rounded-full mx-2 overflow-hidden">
                  <div className="w-1/2 h-full bg-white/40"></div>
                </div>
                <button className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
              <button className="text-xs font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                全体を表示
              </button>
            </div>
          </div>

          {/* Timeline Tracks */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden timeline-scroll relative flex flex-col">
            {/* Time ruler */}
            <div className="h-8 min-w-[1200px] bg-[#231810] border-b border-white/5 flex items-end text-[10px] text-white/40 font-mono select-none sticky top-0 z-10">
              <div className="flex w-full px-20">
                {[0, 15, 30, 45, 60, 75, 90, 105].map((time) => (
                  <div key={time} className="flex-1 border-l border-white/10 pl-1">
                    {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[340px] w-[2px] bg-primary z-30 pointer-events-none">
              <div className="absolute -top-0 -left-[5px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary"></div>
            </div>

            {/* Video Track */}
            <div className="h-16 min-w-[1200px] flex items-center bg-[#2c1e16] border-b border-white/5 relative group py-1">
              <div className="sticky left-0 w-24 bg-[#2c1e16] h-full flex flex-col items-center justify-center gap-1 border-r border-white/10 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                <span className="material-symbols-outlined text-white/60 text-lg">movie</span>
                <span className="text-[10px] text-white/50">動画</span>
              </div>
              <div className="flex-1 relative h-full flex items-center px-4">
                {videoClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="h-12 bg-blue-600/30 border border-blue-500/50 rounded-lg flex items-center justify-center overflow-hidden relative group/clip cursor-pointer hover:bg-blue-600/40 transition-colors mr-1"
                    style={{ width: clip.width }}
                    data-test-id={`video-clip-${clip.id}`}
                  >
                    <span className="text-[10px] text-blue-100 font-medium relative z-10 truncate px-2">
                      {clip.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitle Track */}
            <div className="h-12 min-w-[1200px] flex items-center bg-[#2c1e16] border-b border-white/5 relative group">
              <div className="sticky left-0 w-24 bg-[#2c1e16] h-full flex flex-col items-center justify-center gap-1 border-r border-white/10 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                <span className="material-symbols-outlined text-white/60 text-lg">subtitles</span>
                <span className="text-[10px] text-white/50">字幕</span>
              </div>
              <div className="flex-1 relative h-full flex items-center px-4">
                {subtitles.map((sub, index) => (
                  <div
                    key={sub.id}
                    onClick={() => openSubtitleModal(index)}
                    className={`h-8 border rounded flex items-center px-2 cursor-pointer hover:bg-opacity-30 transition-colors ${
                      sub.highlight
                        ? 'bg-primary/20 border-primary/50 hover:bg-primary/30 shadow-[0_0_10px_rgba(249,116,21,0.1)]'
                        : 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    style={{ width: sub.width, marginLeft: sub.id === '1' ? '20px' : '40px' }}
                    data-test-id={`subtitle-${sub.id}`}
                  >
                    <span className={`text-[10px] truncate ${sub.highlight ? 'text-orange-200 font-bold' : 'text-purple-200'}`}>
                      {sub.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track */}
            <div className="h-14 min-w-[1200px] flex items-center bg-[#2c1e16] border-b border-white/5 relative group">
              <div className="sticky left-0 w-24 bg-[#2c1e16] h-full flex flex-col items-center justify-center gap-1 border-r border-white/10 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                <span className="material-symbols-outlined text-white/60 text-lg">graphic_eq</span>
                <span className="text-[10px] text-white/50">音声</span>
              </div>
              <div className="flex-1 relative h-full flex items-center px-4 py-1">
                <div className="w-full h-[60%] flex items-end gap-[1px]">
                  {[40, 60, 90, 30, 10, 10, 50, 80].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${height <= 10 ? 'bg-red-500/50' : 'bg-emerald-500'}`}
                      style={{ height: `${height}%` }}
                      title={height <= 10 ? 'Silence' : ''}
                    ></div>
                  ))}
                </div>
                {/* Silence indicator */}
                <div className="absolute left-[300px] w-[60px] h-[80%] bg-black/50 border border-white/10 flex items-center justify-center rounded z-10 backdrop-blur-[1px]">
                  <span className="material-symbols-outlined text-white/30 text-xs">mic_off</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="flex-1 bg-[#1a110a] flex flex-col min-h-0">
          <div className="flex items-center px-4 border-b border-[#4a3221] bg-[#231810]">
            {[
              { id: 'ai', label: 'AI提案', icon: 'auto_fix_high' },
              { id: 'subtitle', label: '字幕', icon: 'subtitles' },
              { id: 'cut', label: 'カット', icon: 'content_cut' },
              { id: 'style', label: 'スタイル', icon: 'palette' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                data-test-id={`tab-${tab.id}`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-[#3a2a20] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-colors group"
                  data-test-id={`suggestion-${suggestion.type}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`size-10 rounded-lg ${suggestion.iconBg} ${suggestion.iconColor} flex items-center justify-center`}>
                      <span className="material-symbols-outlined">{suggestion.icon}</span>
                    </div>
                    {suggestion.recommended && (
                      <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded">
                        推奨
                      </span>
                    )}
                  </div>
                  <h4 className="text-white font-bold mb-1">{suggestion.title}</h4>
                  <p className="text-white/60 text-sm mb-4">{suggestion.description}</p>
                  <div className="flex gap-2 mt-auto">
                    <button
                      className={`flex-1 text-sm font-bold py-2 rounded-lg transition-colors shadow-lg ${
                        suggestion.recommended
                          ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`}
                      data-test-id={`apply-${suggestion.type}`}
                    >
                      {suggestion.recommended ? '全て適用' : '適用'}
                    </button>
                    {suggestion.recommended && (
                      <button
                        className="px-3 bg-white/5 text-white/70 hover:text-white rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        title="プレビュー"
                        data-test-id={`preview-${suggestion.type}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">play_circle</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Toolbar */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[800px] px-4 ${isLoading || error ? 'hidden' : ''}`}>
        <div className="bg-[#2c1e16]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2 flex items-center justify-between">
          <div className="flex items-center gap-1 pl-2">
            <button
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="元に戻す"
              data-test-id="undo-button"
            >
              <span className="material-symbols-outlined">undo</span>
            </button>
            <button
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="やり直し"
              data-test-id="redo-button"
            >
              <span className="material-symbols-outlined">redo</span>
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            <span className="text-xs text-white/40 ml-1">自動保存: 2分前</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
              下書き保存
            </button>
            <div className="relative group">
              <button
                onClick={() => setIsExportModalOpen(true)}
                disabled={isExporting}
                className="flex items-center gap-2 pl-4 pr-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-test-id="export-button"
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                    書き出し中...
                  </span>
                ) : (
                  <>
                    書き出し
                    <span className="w-[1px] h-4 bg-white/30"></span>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Edit Modal */}
      {isSubtitleModalOpen && subtitles[selectedSubtitleIndex] && (
        <SubtitleEditModal
          subtitle={{
            ...subtitles[selectedSubtitleIndex],
            start: Math.round((subtitles[selectedSubtitleIndex].startTime ?? 0) * 1000),
            end: Math.round((subtitles[selectedSubtitleIndex].endTime ?? 0) * 1000),
          }}
          currentIndex={selectedSubtitleIndex}
          totalCount={subtitles.length}
          onClose={() => setIsSubtitleModalOpen(false)}
          onSave={handleSaveSubtitle}
          onDelete={handleDeleteSubtitle}
          onPrev={() => setSelectedSubtitleIndex(Math.max(0, selectedSubtitleIndex - 1))}
          onNext={() => setSelectedSubtitleIndex(Math.min(subtitles.length - 1, selectedSubtitleIndex + 1))}
        />
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          isPro={false}
        />
      )}
    </div>
  )
}
