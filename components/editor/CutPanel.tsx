'use client'

interface SilenceRegion {
  start: number
  end: number
}

interface CutPanelProps {
  videos: Array<{ silenceDetected?: { regions?: SilenceRegion[] } }>
  isApplied?: boolean
  onApplyCuts: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1)
  return `${String(m).padStart(2, '0')}:${s.padStart(4, '0')}`
}

export default function CutPanel({ videos, isApplied = false, onApplyCuts }: CutPanelProps) {
  const silenceRegions: SilenceRegion[] = videos.flatMap(
    (v) => v.silenceDetected?.regions ?? []
  )

  if (silenceRegions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/50">
        <span className="material-symbols-outlined text-5xl mb-4">content_cut</span>
        <p className="text-sm">無音区間が検出されていません</p>
        <p className="text-xs mt-2 text-white/30">動画を処理すると無音区間が自動検出されます</p>
      </div>
    )
  }

  const totalDuration = silenceRegions.reduce((sum, r) => sum + (r.end - r.start), 0)

  return (
    <div className="max-w-[800px] mx-auto space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-white/60">{silenceRegions.length} 件の無音区間を検出</p>
          <p className="text-xs text-white/40 mt-1">
            合計 {totalDuration.toFixed(1)} 秒の短縮が可能
          </p>
        </div>
        <button
          onClick={onApplyCuts}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors shadow-lg ${
            isApplied
              ? 'bg-emerald-500/15 text-emerald-200 shadow-emerald-500/10'
              : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
          }`}
          data-test-id="apply-all-cuts"
        >
          <span className="material-symbols-outlined text-[18px]">content_cut</span>
          {isApplied ? '適用済み' : '全てカット'}
        </button>
      </div>
      {silenceRegions.map((region, index) => {
        const duration = region.end - region.start
        return (
          <div
            key={index}
            className="bg-[#3a2a20] border border-white/5 rounded-xl p-4 hover:border-primary/30 transition-colors"
            data-test-id={`silence-region-${index}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">mic_off</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium font-mono">
                    {formatTime(region.start)} - {formatTime(region.end)}
                  </p>
                  <p className="text-xs text-white/40">{duration.toFixed(1)} 秒</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
