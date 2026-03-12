'use client'

import { type Subtitle } from '@/components/modals'

interface SubtitlePanelProps {
  subtitles: Subtitle[]
  selectedSubtitleId?: string | null
  onEditSubtitle: (index: number) => void
  onAddSubtitle: () => void
}

function formatTimeSeconds(ms: number | undefined): string {
  if (ms === undefined) return '00:00.000'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

export default function SubtitlePanel({
  subtitles,
  selectedSubtitleId,
  onEditSubtitle,
  onAddSubtitle,
}: SubtitlePanelProps) {
  if (subtitles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/50">
        <span className="material-symbols-outlined text-5xl mb-4">subtitles_off</span>
        <p className="text-sm mb-4">字幕がありません</p>
        <button
          onClick={onAddSubtitle}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors"
          data-test-id="add-subtitle-empty"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          字幕を追加
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/60">{subtitles.length} 件の字幕</p>
        <button
          onClick={onAddSubtitle}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors"
          data-test-id="add-subtitle-button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          字幕を追加
        </button>
      </div>
      {subtitles.map((subtitle, index) => (
        <button
          key={subtitle.id}
          onClick={() => onEditSubtitle(index)}
          className={`w-full text-left rounded-xl border p-4 transition-colors group ${
            subtitle.id === selectedSubtitleId
              ? 'border-primary/40 bg-primary/10'
              : 'border-white/5 bg-[#3a2a20] hover:border-primary/30 hover:bg-[#3a2a20]/80'
          }`}
          data-test-id={`subtitle-item-${subtitle.id}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate mb-1">{subtitle.text}</p>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="font-mono">
                  {formatTimeSeconds(subtitle.start)} - {formatTimeSeconds(subtitle.end)}
                </span>
                {subtitle.style && subtitle.style !== 'standard' && (
                  <span className="px-2 py-0.5 bg-white/5 rounded text-white/60">
                    {subtitle.style}
                  </span>
                )}
              </div>
            </div>
            <span className="material-symbols-outlined text-white/30 group-hover:text-primary text-[20px] mt-1 transition-colors">
              edit
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
