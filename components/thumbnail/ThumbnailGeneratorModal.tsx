'use client'

import { LayoutTemplate, Upload, Film, Users, Loader2 } from 'lucide-react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'
import type { ThumbnailMode } from '@/lib/ai-thumbnail'
import type { PlaybackSegment } from '@/lib/editor'
import ThumbnailTemplateGrid from './ThumbnailTemplateGrid'
import ThumbnailUploader from './ThumbnailUploader'
import ThumbnailFramePicker from './ThumbnailFramePicker'
import ThumbnailReferenceInput from './ThumbnailReferenceInput'
import ThumbnailPromptInput from './ThumbnailPromptInput'
import ThumbnailPreviewGrid from './ThumbnailPreviewGrid'

interface ThumbnailGeneratorModalProps {
  projectId: string
  playheadSeconds: number
  durationSeconds: number
  playbackSegments: PlaybackSegment[]
  onClose: () => void
}

const tabs: { mode: ThumbnailMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'TEMPLATE', label: 'テンプレート', icon: <LayoutTemplate className="h-4 w-4" /> },
  { mode: 'UPLOAD', label: '素材アップ', icon: <Upload className="h-4 w-4" /> },
  { mode: 'VIDEO_FRAME', label: '動画から', icon: <Film className="h-4 w-4" /> },
  { mode: 'REFERENCE', label: '参考風', icon: <Users className="h-4 w-4" /> },
]

export default function ThumbnailGeneratorModal({
  projectId,
  playheadSeconds,
  durationSeconds,
  playbackSegments,
  onClose,
}: ThumbnailGeneratorModalProps) {
  const {
    generationMode,
    setGenerationMode,
    isGenerating,
    generationError,
    prompt,
    generate,
    reset,
  } = useThumbnailStore()

  const handleGenerate = async () => {
    await generate(projectId)
  }

  const handleClose = () => {
    onClose()
  }

  const canGenerate = prompt.trim().length > 0 && !isGenerating

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2c1e16] shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">image</span>
            <h2 className="text-lg font-bold text-white">サムネイル生成</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* タブ切替 */}
            <div className="flex rounded-xl border border-white/10 bg-white/3 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setGenerationMode(tab.mode)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all ${
                    generationMode === tab.mode
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* タブコンテンツ */}
            <div className="min-h-[160px]">
              {generationMode === 'TEMPLATE' && <ThumbnailTemplateGrid />}
              {generationMode === 'UPLOAD' && <ThumbnailUploader />}
              {generationMode === 'VIDEO_FRAME' && (
                <ThumbnailFramePicker
                  projectId={projectId}
                  playheadSeconds={playheadSeconds}
                  durationSeconds={durationSeconds}
                  playbackSegments={playbackSegments}
                />
              )}
              {generationMode === 'REFERENCE' && <ThumbnailReferenceInput />}
            </div>

            {/* セパレータ */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                テキスト・オプション
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* プロンプト入力 */}
            <ThumbnailPromptInput />

            {/* エラー表示 */}
            {generationError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {generationError}
              </div>
            )}

            {/* 生成ボタン */}
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  サムネイルを生成
                </>
              )}
            </button>

            {/* 生成結果 */}
            <ThumbnailPreviewGrid projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  )
}
