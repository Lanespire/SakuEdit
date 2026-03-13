'use client'

import { useState, useCallback } from 'react'
import { Film, Clock, Check } from 'lucide-react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'
import { mapTimelineTimeToSourceTime, type PlaybackSegment } from '@/lib/editor'

interface ThumbnailFramePickerProps {
  projectId: string
  playheadSeconds: number
  durationSeconds: number
  playbackSegments: PlaybackSegment[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ThumbnailFramePicker({
  projectId,
  playheadSeconds,
  durationSeconds,
  playbackSegments,
}: ThumbnailFramePickerProps) {
  const {
    extractedFrames,
    selectedFrameTimestamps,
    toggleFrameTimestamp,
    extractFrames,
  } = useThumbnailStore()

  const [seekPosition, setSeekPosition] = useState(playheadSeconds)
  const [isExtracting, setIsExtracting] = useState(false)

  // timeline time を source time に変換
  const sourceTime = mapTimelineTimeToSourceTime(seekPosition, playbackSegments)

  const handleExtractCurrentFrame = useCallback(async () => {
    setIsExtracting(true)
    try {
      await extractFrames(projectId, [sourceTime])
    } finally {
      setIsExtracting(false)
    }
  }, [extractFrames, projectId, sourceTime])

  const handleUsePlayheadPosition = useCallback(() => {
    setSeekPosition(playheadSeconds)
  }, [playheadSeconds])

  const handleExtractMultiple = useCallback(async () => {
    if (durationSeconds <= 0) return
    setIsExtracting(true)
    // 動画を5等分してフレームを抽出
    const count = 5
    const interval = durationSeconds / (count + 1)
    const timestamps = Array.from({ length: count }, (_, i) => {
      const timelineTime = interval * (i + 1)
      return mapTimelineTimeToSourceTime(timelineTime, playbackSegments)
    })
    try {
      await extractFrames(projectId, timestamps)
    } finally {
      setIsExtracting(false)
    }
  }, [durationSeconds, extractFrames, playbackSegments, projectId])

  return (
    <div className="space-y-3">
      {/* シークバー */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-white/50">
            フレーム位置: {formatTime(seekPosition)}
          </label>
          <button
            type="button"
            onClick={handleUsePlayheadPosition}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
          >
            <Clock className="h-3 w-3" />
            現在位置を使う
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={durationSeconds}
          step={0.1}
          value={seekPosition}
          onChange={(e) => setSeekPosition(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
        />
        <div className="flex justify-between text-[9px] text-white/30">
          <span>0:00</span>
          <span>{formatTime(durationSeconds)}</span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExtractCurrentFrame}
          disabled={isExtracting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <Film className="h-3.5 w-3.5" />
          {isExtracting ? '抽出中...' : 'このフレームを抽出'}
        </button>
        <button
          type="button"
          onClick={handleExtractMultiple}
          disabled={isExtracting}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          自動抽出
        </button>
      </div>

      {/* 抽出済みフレーム */}
      {extractedFrames.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-white/50">
            抽出フレーム（クリックで選択）
          </span>
          <div className="grid grid-cols-3 gap-2">
            {extractedFrames.map((frame) => {
              const isSelected = selectedFrameTimestamps.includes(frame.timestamp)
              return (
                <button
                  key={frame.timestamp}
                  type="button"
                  onClick={() => toggleFrameTimestamp(frame.timestamp)}
                  className={`group relative aspect-video overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <img
                    src={`data:image/jpeg;base64,${frame.base64}`}
                    alt={`${formatTime(frame.timestamp)}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                    <span className="text-[9px] text-white/80">
                      {formatTime(frame.timestamp)}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
