'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Subtitle } from '@/components/modals'
import {
  formatTimelineTime,
  getPlaybackSegments,
  mapSourceTimeToTimelineTime,
  type EditorMarker,
  type EditorVideoAsset,
} from '@/lib/editor'
import AudioWaveformTrack from './AudioWaveformTrack'

interface EditorTimelineProps {
  video: EditorVideoAsset | null
  subtitles: Subtitle[]
  markers: EditorMarker[]
  selectedSubtitleId: string | null
  durationSeconds: number
  playheadSeconds: number
  zoomLevel: number
  scrollPosition: number
  cutApplied: boolean
  onPlayheadChange: (seconds: number) => void
  onZoomChange: (zoomLevel: number) => void
  onScrollPositionChange: (scrollPosition: number) => void
  onSelectSubtitle: (index: number) => void
  onEditSubtitle?: (index: number) => void
  showHeader?: boolean
}

const TRACK_LABEL_WIDTH = 104

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function EditorTimeline({
  video,
  subtitles,
  markers,
  selectedSubtitleId,
  durationSeconds,
  playheadSeconds,
  zoomLevel,
  scrollPosition,
  cutApplied,
  onPlayheadChange,
  onZoomChange,
  onScrollPositionChange,
  onSelectSubtitle,
  onEditSubtitle,
  showHeader = true,
}: EditorTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pxPerSecond = 64 * zoomLevel
  const playbackSegments = useMemo(
    () => getPlaybackSegments(video?.duration ?? durationSeconds, video?.silenceRegions ?? [], cutApplied),
    [cutApplied, durationSeconds, video?.duration, video?.silenceRegions],
  )
  const mediaDurationSeconds = playbackSegments.at(-1)?.timelineEnd ?? durationSeconds
  const maxSubtitleEnd = subtitles.reduce((max, subtitle) => {
    const endTime = mapSourceTimeToTimelineTime(subtitle.endTime ?? subtitle.startTime ?? 0, playbackSegments)
    return Math.max(max, endTime)
  }, 0)
  const maxMarkerTime = markers.reduce((max, marker) => {
    const time = mapSourceTimeToTimelineTime(marker.time, playbackSegments)
    return Math.max(max, time)
  }, 0)
  const visualDurationSeconds = Math.max(mediaDurationSeconds, durationSeconds, maxSubtitleEnd, maxMarkerTime, 0.1)
  const timelineWidth = Math.max(1200, visualDurationSeconds * pxPerSecond + TRACK_LABEL_WIDTH + 64)

  useEffect(() => {
    const node = scrollRef.current

    if (!node) {
      return
    }

    if (Math.abs(node.scrollLeft - scrollPosition) > 8) {
      node.scrollLeft = scrollPosition
    }
  }, [scrollPosition])

  const tickInterval = visualDurationSeconds > 120 ? 10 : visualDurationSeconds > 45 ? 5 : 2
  const ticks = Array.from({ length: Math.ceil(visualDurationSeconds / tickInterval) + 1 }, (_, index) => index * tickInterval)

  const subtitleBlocks = subtitles.map((subtitle, index) => {
    const startTime = mapSourceTimeToTimelineTime(subtitle.startTime ?? 0, playbackSegments)
    const endTime = mapSourceTimeToTimelineTime(subtitle.endTime ?? subtitle.startTime ?? 0, playbackSegments)
    const left = TRACK_LABEL_WIDTH + startTime * pxPerSecond
    const width = Math.max(44, (endTime - startTime) * pxPerSecond)

    return {
      subtitle,
      index,
      left,
      width,
    }
  })

  const markerPositions = markers.map((marker) => ({
    ...marker,
    left: TRACK_LABEL_WIDTH + mapSourceTimeToTimelineTime(marker.time, playbackSegments) * pxPerSecond,
  }))

  const silenceOverlays = cutApplied
    ? []
    : (video?.silenceRegions ?? []).map((region, index) => ({
        id: `silence-overlay-${index}`,
        left: TRACK_LABEL_WIDTH + region.start * pxPerSecond,
        width: Math.max(12, (region.end - region.start) * pxPerSecond),
      }))

  const playheadLeft = TRACK_LABEL_WIDTH + playheadSeconds * pxPerSecond

  const updatePlayheadFromPointer = (clientX: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect()
    const relativeX = clientX - rect.left - TRACK_LABEL_WIDTH
    const nextTime = clamp(relativeX / pxPerSecond, 0, visualDurationSeconds)
    onPlayheadChange(nextTime)
  }

  return (
    <div className="flex h-full flex-col bg-[#1a1512]">
      {showHeader ? (
        <div
          className="flex items-center justify-between border-b border-[#3f2c22] bg-[#1b1512] px-3 py-2"
          data-test-id="main-timeline-header"
        >
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/72">
            <span className="material-symbols-outlined text-[16px] text-primary">view_timeline</span>
            Timeline
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md bg-white/5 p-1">
              <button
                type="button"
                className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => onZoomChange(clamp(Number((zoomLevel - 0.2).toFixed(2)), 0.5, 3))}
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <div className="mx-2 w-16 text-center text-[11px] font-bold text-white/55">{zoomLevel.toFixed(1)}x</div>
              <button
                type="button"
                className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => onZoomChange(clamp(Number((zoomLevel + 0.2).toFixed(2)), 0.5, 3))}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            <button
              type="button"
              className="rounded-md border border-transparent px-2.5 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
              onClick={() => onZoomChange(1)}
            >
              Fit
            </button>
          </div>
        </div>
      ) : null}

      <div ref={scrollRef} className="timeline-scroll relative flex-1 overflow-x-auto overflow-y-auto bg-[#211b18]" onScroll={(event) => onScrollPositionChange(event.currentTarget.scrollLeft)}>
        <div
          ref={canvasRef}
          className="relative cursor-pointer"
          style={{ width: timelineWidth }}
          onClick={(event) => updatePlayheadFromPointer(event.clientX, event.currentTarget)}
        >
          <div className="sticky top-0 z-20 flex h-14 items-end border-b border-[#4a3528] bg-[#2a221d] text-[14px] font-mono text-white/80">
            <div
              className="sticky left-0 z-30 flex items-center justify-center border-r border-[#4a3528] bg-[#2a221d] text-[11px] font-bold uppercase tracking-[0.18em] text-white/65"
              style={{ width: TRACK_LABEL_WIDTH }}
            >
              Time
            </div>
            <div className="relative flex-1">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute bottom-0 top-0 border-l border-white/10 pl-2 pt-5 font-semibold"
                  style={{ left: tick * pxPerSecond }}
                >
                  {formatTimelineTime(tick)}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-14 z-0">
            {ticks.map((tick) => (
              <div
                key={`grid-${tick}`}
                className="absolute bottom-0 top-0 border-l border-white/6"
                style={{ left: TRACK_LABEL_WIDTH + tick * pxPerSecond }}
              />
            ))}
          </div>

          <div
            className="pointer-events-none absolute bottom-0 top-0 z-30 w-[2px] bg-primary"
            style={{ left: playheadLeft }}
          >
            <div className="absolute -left-7 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-white shadow-lg">
              {formatTimelineTime(playheadSeconds)}
            </div>
            <div className="absolute -left-[5px] top-0 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
          </div>

          <div className="relative mt-4 flex h-[54px] items-center overflow-hidden rounded-2xl border border-[#49362a] bg-[#2a221d]">
            <div
              className="sticky left-0 z-20 flex h-full flex-col items-start justify-center gap-0.5 border-r border-[#49362a] bg-[#241d19] px-4 shadow-[4px_0_10px_rgba(0,0,0,0.16)]"
              style={{ width: TRACK_LABEL_WIDTH }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfb29a]">見どころ</span>
              <span className="text-[12px] text-[#9f8571]">マーカー</span>
            </div>

            <div className="relative h-full flex-1">
              {markerPositions.length > 0 ? (
                markerPositions.map((marker) => (
                  <div
                    key={marker.id}
                    className="pointer-events-none absolute inset-y-0 flex items-center"
                    style={{ left: marker.left }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-px opacity-45"
                      style={{ backgroundColor: marker.color }}
                    />
                    <div
                      className="ml-2 rounded-full border px-3 py-1 text-[11px] font-bold shadow-sm"
                      style={{
                        backgroundColor: `${marker.color}20`,
                        borderColor: `${marker.color}66`,
                        color: marker.color,
                      }}
                    >
                      {marker.label ?? marker.type}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center px-4 text-sm text-white/45">マーカーはまだありません</div>
              )}
            </div>
          </div>

          {markerPositions.map((marker) => (
            <div
              key={marker.id}
              className="pointer-events-none absolute top-14 z-10 h-[calc(100%-3.5rem)] w-px opacity-30"
              style={{ left: marker.left, backgroundColor: marker.color }}
            />
          ))}

          <div
            className="relative mt-4 flex h-[82px] items-center overflow-hidden rounded-2xl border border-[#49362a] bg-[#2b2420] shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
            data-test-id="main-timeline-video-track"
          >
            <div
              className="sticky left-0 z-20 flex h-full flex-col items-start justify-center gap-0.5 border-r border-[#49362a] bg-[#241d19] px-4 shadow-[4px_0_10px_rgba(0,0,0,0.16)]"
              style={{ width: TRACK_LABEL_WIDTH }}
            >
              <span className="material-symbols-outlined text-[20px] text-white/80">movie</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfb29a]">動画</span>
              <span className="text-[12px] text-[#9f8571]">{formatTimelineTime(mediaDurationSeconds)}</span>
            </div>

            <div
              className="absolute inset-y-3 rounded-2xl border border-sky-300/45 bg-sky-500/18"
              style={{
                left: TRACK_LABEL_WIDTH,
                width: Math.max(180, mediaDurationSeconds * pxPerSecond),
              }}
            >
              <div className="flex h-full items-center justify-between gap-4 px-4 text-sm font-bold text-sky-100">
                <span className="truncate">{video?.filename ?? 'ソース動画'}</span>
                <span className="shrink-0 text-sky-50/90">{cutApplied ? 'カット後プレビュー' : '元動画'}</span>
              </div>
            </div>
          </div>

          <div
            className="relative mt-4 flex h-[68px] items-center overflow-hidden rounded-2xl border border-[#49362a] bg-[#2b2420] shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
            data-test-id="main-timeline-subtitle-track"
          >
            <div
              className="sticky left-0 z-20 flex h-full flex-col items-start justify-center gap-0.5 border-r border-[#49362a] bg-[#241d19] px-4 shadow-[4px_0_10px_rgba(0,0,0,0.16)]"
              style={{ width: TRACK_LABEL_WIDTH }}
            >
              <span className="material-symbols-outlined text-[20px] text-white/80">subtitles</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfb29a]">字幕</span>
              <span className="text-[12px] text-[#9f8571]">{subtitles.length}件</span>
            </div>

            {subtitleBlocks.map(({ subtitle, index, left, width }) => (
              <button
                key={subtitle.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectSubtitle(index)
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onEditSubtitle?.(index)
                }}
                className={`absolute flex h-11 items-center rounded-xl border px-3 text-left text-[12px] font-semibold transition-colors ${
                  subtitle.id === selectedSubtitleId
                    ? 'border-primary/60 bg-primary/24 text-orange-50 shadow-[0_0_18px_rgba(249,116,21,0.16)]'
                    : 'border-violet-300/25 bg-violet-500/12 text-violet-50 hover:border-violet-300/45 hover:bg-violet-500/22'
                }`}
                style={{ left, width, top: 12 }}
                data-test-id={`subtitle-${subtitle.id}`}
              >
                <span className="truncate">{subtitle.text}</span>
              </button>
            ))}
          </div>

          <div
            className="relative mt-4 mb-5 flex h-[88px] items-center overflow-hidden rounded-2xl border border-[#49362a] bg-[#2b2420] shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
            data-test-id="main-timeline-audio-track"
          >
            <div
              className="sticky left-0 z-20 flex h-full flex-col items-start justify-center gap-0.5 border-r border-[#49362a] bg-[#241d19] px-4 shadow-[4px_0_10px_rgba(0,0,0,0.16)]"
              style={{ width: TRACK_LABEL_WIDTH }}
            >
              <span className="material-symbols-outlined text-[20px] text-white/80">graphic_eq</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfb29a]">音声</span>
              <span className="text-[12px] text-[#9f8571]">波形</span>
            </div>

            {silenceOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="absolute inset-y-3 rounded-xl border border-red-400/20 bg-red-500/10"
                style={{ left: overlay.left, width: overlay.width }}
              />
            ))}

            <div
              className="absolute inset-y-3 overflow-hidden rounded-xl px-3"
              style={{
                left: TRACK_LABEL_WIDTH,
                width: Math.max(180, mediaDurationSeconds * pxPerSecond),
              }}
            >
              <AudioWaveformTrack
                audioUrl={video?.previewUrl ?? null}
                waveform={video?.waveform ?? []}
                durationSeconds={mediaDurationSeconds}
                widthPx={Math.max(180, mediaDurationSeconds * pxPerSecond) - 24}
                playheadSeconds={playheadSeconds}
                onSeek={onPlayheadChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
