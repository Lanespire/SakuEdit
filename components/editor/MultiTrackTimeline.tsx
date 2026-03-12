'use client'

import { useCallback, useRef, useState, useMemo } from 'react'
import {
  Eye,
  EyeOff,
  Film,
  Volume2,
  Type,
  Sparkles,
  Layers,
  MessageSquare,
} from 'lucide-react'
import type {
  CompositionData,
  TrackName,
  CaptionItem,
} from '@/lib/composition-data'
import { formatTimelineTime } from '@/lib/editor'
import TrackItem from './TrackItem'

export interface MultiTrackTimelineProps {
  compositionData: CompositionData
  durationSeconds: number
  playheadSeconds: number
  zoomLevel: number
  scrollPosition: number
  selectedItemId: string | null
  selectedItemTrack: TrackName | null
  onPlayheadChange: (seconds: number) => void
  onZoomChange: (zoom: number) => void
  onScrollPositionChange: (pos: number) => void
  onSelectItem: (itemId: string | null, track: TrackName | null) => void
  onMoveItem: (track: TrackName, itemId: string, newStartTime: number) => void
  onResizeItem: (track: TrackName, itemId: string, newStartTime: number, newEndTime: number) => void
}

const LABEL_WIDTH = 80
const TRACK_HEIGHT = 40

const trackColors: Record<TrackName, string> = {
  videoTrack: 'bg-blue-500/60',
  audioTracks: 'bg-green-500/60',
  subtitleTrack: 'bg-yellow-500/60',
  effectTrack: 'bg-purple-500/60',
  overlayTrack: 'bg-orange-500/60',
  captionTrack: 'bg-pink-500/60',
}

const trackIcons: Record<TrackName, React.ReactNode> = {
  videoTrack: <Film className="h-3.5 w-3.5" />,
  audioTracks: <Volume2 className="h-3.5 w-3.5" />,
  subtitleTrack: <Type className="h-3.5 w-3.5" />,
  effectTrack: <Sparkles className="h-3.5 w-3.5" />,
  overlayTrack: <Layers className="h-3.5 w-3.5" />,
  captionTrack: <MessageSquare className="h-3.5 w-3.5" />,
}

const trackLabels: Record<TrackName, string> = {
  videoTrack: 'Video',
  audioTracks: 'Audio',
  subtitleTrack: 'Subtitle',
  effectTrack: 'Effect',
  overlayTrack: 'Overlay',
  captionTrack: 'Caption',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Normalize a caption item (ms-based) to standard { startTime, endTime } in seconds */
function normalizeCaptionTiming(item: CaptionItem): { id: string; startTime: number; endTime: number; [key: string]: unknown } {
  return {
    ...item,
    startTime: item.startMs / 1000,
    endTime: item.endMs / 1000,
  }
}

function getItemLabel(item: Record<string, unknown>, track: TrackName): string {
  if (track === 'subtitleTrack' || track === 'captionTrack') {
    return (item.text as string) ?? ''
  }
  if (track === 'effectTrack') {
    return (item.effectType as string) ?? 'Effect'
  }
  if (track === 'overlayTrack') {
    return (item.overlayType as string) ?? 'Overlay'
  }
  if (track === 'audioTracks') {
    const cat = (item.category as string) ?? ''
    const sfx = (item.sfxType as string) ?? ''
    return sfx || cat
  }
  if (track === 'videoTrack') {
    return (item.sourceUrl as string)?.split('/').pop() ?? 'Video'
  }
  return ''
}

interface TrackRowConfig {
  trackName: TrackName
  items: Array<{ id: string; startTime: number; endTime: number; [key: string]: unknown }>
}

export default function MultiTrackTimeline({
  compositionData,
  durationSeconds,
  playheadSeconds,
  zoomLevel,
  scrollPosition,
  selectedItemId,
  selectedItemTrack,
  onPlayheadChange,
  onZoomChange,
  onScrollPositionChange,
  onSelectItem,
  onMoveItem,
  onResizeItem,
}: MultiTrackTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hiddenTracks, setHiddenTracks] = useState<Set<TrackName>>(new Set())
  const dragRef = useRef<{
    track: TrackName
    itemId: string
    mode: 'move' | 'resize-left' | 'resize-right'
    startX: number
    origStart: number
    origEnd: number
  } | null>(null)

  const pixelsPerSecond = 100 * zoomLevel
  const rulerWidth = Math.max(800, durationSeconds * pixelsPerSecond + 200)

  // Build track rows
  const trackRows = useMemo<TrackRowConfig[]>(() => {
    const rows: TrackRowConfig[] = []

    // Video
    if (compositionData.videoTrack.length > 0) {
      rows.push({
        trackName: 'videoTrack',
        items: compositionData.videoTrack.map((v) => ({
          ...v,
          startTime: v.startTime ?? 0,
          endTime: v.endTime ?? durationSeconds,
        })),
      })
    }

    // Audio
    if (compositionData.audioTracks.length > 0) {
      rows.push({
        trackName: 'audioTracks',
        items: compositionData.audioTracks.map((a) => ({
          ...a,
          startTime: a.startTime ?? 0,
          endTime: a.endTime ?? durationSeconds,
        })),
      })
    }

    // Subtitle
    if (compositionData.subtitleTrack.length > 0) {
      rows.push({
        trackName: 'subtitleTrack',
        items: compositionData.subtitleTrack as Array<{ id: string; startTime: number; endTime: number; [key: string]: unknown }>,
      })
    }

    // Caption
    if (compositionData.captionTrack.length > 0) {
      rows.push({
        trackName: 'captionTrack',
        items: compositionData.captionTrack.map(normalizeCaptionTiming),
      })
    }

    // Effect
    if (compositionData.effectTrack.length > 0) {
      rows.push({
        trackName: 'effectTrack',
        items: compositionData.effectTrack as Array<{ id: string; startTime: number; endTime: number; [key: string]: unknown }>,
      })
    }

    // Overlay
    if (compositionData.overlayTrack.length > 0) {
      rows.push({
        trackName: 'overlayTrack',
        items: compositionData.overlayTrack as Array<{ id: string; startTime: number; endTime: number; [key: string]: unknown }>,
      })
    }

    return rows
  }, [compositionData, durationSeconds])

  const toggleTrackVisibility = useCallback((trackName: TrackName) => {
    setHiddenTracks((prev) => {
      const next = new Set(prev)
      if (next.has(trackName)) {
        next.delete(trackName)
      } else {
        next.add(trackName)
      }
      return next
    })
  }, [])

  // Ruler ticks
  const tickInterval = durationSeconds > 120 ? 10 : durationSeconds > 45 ? 5 : 2
  const ticks = useMemo(
    () => Array.from({ length: Math.ceil(durationSeconds / tickInterval) + 1 }, (_, i) => i * tickInterval),
    [durationSeconds, tickInterval],
  )

  // Handle click on ruler area for playhead
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const relX = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0) - LABEL_WIDTH
      const time = clamp(relX / pixelsPerSecond, 0, durationSeconds)
      onPlayheadChange(time)
    },
    [pixelsPerSecond, durationSeconds, onPlayheadChange],
  )

  // Drag handling
  const handleDragStart = useCallback(
    (track: TrackName, itemId: string, e: React.MouseEvent) => {
      const item = trackRows
        .find((r) => r.trackName === track)
        ?.items.find((i) => i.id === itemId)
      if (!item) return

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const relX = e.clientX - rect.left
      const edgeThreshold = 8

      let mode: 'move' | 'resize-left' | 'resize-right' = 'move'
      if (relX <= edgeThreshold) {
        mode = 'resize-left'
      } else if (relX >= rect.width - edgeThreshold) {
        mode = 'resize-right'
      }

      dragRef.current = {
        track,
        itemId,
        mode,
        startX: e.clientX,
        origStart: item.startTime,
        origEnd: item.endTime,
      }

      const handleMouseMove = (ev: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const dx = ev.clientX - drag.startX
        const dt = dx / pixelsPerSecond

        if (drag.mode === 'move') {
          const newStart = Math.max(0, drag.origStart + dt)
          onMoveItem(drag.track, drag.itemId, newStart)
        } else if (drag.mode === 'resize-left') {
          const newStart = clamp(drag.origStart + dt, 0, drag.origEnd - 0.1)
          onResizeItem(drag.track, drag.itemId, newStart, drag.origEnd)
        } else if (drag.mode === 'resize-right') {
          const newEnd = Math.max(drag.origStart + 0.1, drag.origEnd + dt)
          onResizeItem(drag.track, drag.itemId, drag.origStart, newEnd)
        }
      }

      const handleMouseUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [trackRows, pixelsPerSecond, onMoveItem, onResizeItem],
  )

  // Zoom with Ctrl+wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        onZoomChange(clamp(zoomLevel + delta, 0.2, 5))
      }
    },
    [zoomLevel, onZoomChange],
  )

  const playheadLeft = LABEL_WIDTH + playheadSeconds * pixelsPerSecond

  return (
    <div className="flex h-full flex-col bg-[#1a1411]" onWheel={handleWheel}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-x-auto overflow-y-auto"
        onScroll={(e) => onScrollPositionChange(e.currentTarget.scrollLeft)}
      >
        <div className="relative" style={{ width: rulerWidth, minHeight: '100%' }}>
          {/* Time ruler */}
          <div
            className="sticky top-0 z-20 flex h-8 items-end border-b border-white/10 bg-[#2a221d] cursor-pointer"
            onClick={handleRulerClick}
          >
            <div
              className="sticky left-0 z-30 flex items-center justify-center bg-[#2a221d] text-[10px] font-bold text-white/50"
              style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
            />
            <div className="relative flex-1">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute bottom-0 border-l border-white/15 pb-1 pl-1.5 text-[10px] font-mono text-white/50"
                  style={{ left: tick * pixelsPerSecond }}
                >
                  {formatTimelineTime(tick)}
                </div>
              ))}
            </div>
          </div>

          {/* Grid lines */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-8 z-0">
            {ticks.map((tick) => (
              <div
                key={`g-${tick}`}
                className="absolute bottom-0 top-0 border-l border-white/5"
                style={{ left: LABEL_WIDTH + tick * pixelsPerSecond }}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-30 w-[2px] bg-red-500"
            style={{ left: playheadLeft }}
          >
            <div className="absolute -left-1.5 top-0 h-0 w-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-red-500" />
          </div>

          {/* Track rows */}
          <div className="relative">
            {trackRows.map((row) => {
              const isHidden = hiddenTracks.has(row.trackName)

              return (
                <div
                  key={row.trackName}
                  className="flex border-b border-white/5"
                  style={{ height: TRACK_HEIGHT }}
                >
                  {/* Track label */}
                  <div
                    className="sticky left-0 z-20 flex items-center gap-1.5 border-r border-white/10 bg-[#211b18] px-2"
                    style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
                  >
                    <button
                      type="button"
                      className="text-white/40 hover:text-white/70"
                      onClick={() => toggleTrackVisibility(row.trackName)}
                      title={isHidden ? '表示' : '非表示'}
                    >
                      {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <span className="text-white/50">{trackIcons[row.trackName]}</span>
                    <span className="truncate text-[10px] font-medium text-white/60">
                      {trackLabels[row.trackName]}
                    </span>
                  </div>

                  {/* Items area */}
                  <div className="relative flex-1" style={{ opacity: isHidden ? 0.3 : 1 }}>
                    {row.items.map((item) => (
                      <TrackItem
                        key={item.id}
                        item={item}
                        track={row.trackName}
                        color={trackColors[row.trackName]}
                        label={getItemLabel(item as Record<string, unknown>, row.trackName)}
                        isSelected={selectedItemId === item.id && selectedItemTrack === row.trackName}
                        pixelsPerSecond={pixelsPerSecond}
                        onSelect={() => onSelectItem(item.id, row.trackName)}
                        onDoubleClick={() => onSelectItem(item.id, row.trackName)}
                        onDragStart={(e) => handleDragStart(row.trackName, item.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Empty state */}
            {trackRows.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-white/30">
                トラックにアイテムがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
