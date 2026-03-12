'use client'

import { useCallback, useRef } from 'react'
import type { TrackName } from '@/lib/composition-data'

export interface TrackItemProps {
  item: { id: string; startTime: number; endTime: number; [key: string]: unknown }
  track: TrackName
  color: string
  label: string
  isSelected: boolean
  pixelsPerSecond: number
  onSelect: () => void
  onDoubleClick: () => void
  onDragStart: (e: React.MouseEvent) => void
}

export default function TrackItem({
  item,
  track,
  color,
  label,
  isSelected,
  pixelsPerSecond,
  onSelect,
  onDoubleClick,
  onDragStart,
}: TrackItemProps) {
  const width = Math.max(24, (item.endTime - item.startTime) * pixelsPerSecond)
  const left = item.startTime * pixelsPerSecond
  const resizeRef = useRef<'left' | 'right' | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const relX = e.clientX - rect.left
      const edgeThreshold = 8

      if (relX <= edgeThreshold) {
        resizeRef.current = 'left'
      } else if (relX >= rect.width - edgeThreshold) {
        resizeRef.current = 'right'
      } else {
        resizeRef.current = null
      }

      onSelect()
      onDragStart(e)
    },
    [onSelect, onDragStart],
  )

  return (
    <div
      className={`absolute top-1 bottom-1 flex cursor-grab items-center overflow-hidden rounded-md px-2 text-xs font-medium text-white select-none ${color} ${
        isSelected ? 'ring-2 ring-white/80 brightness-110' : 'hover:brightness-110'
      }`}
      style={{ left, width, minWidth: 24 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick()
      }}
      title={label}
    >
      <span className="truncate">{label}</span>
      {/* Left resize handle */}
      <div className="absolute inset-y-0 left-0 w-2 cursor-col-resize" />
      {/* Right resize handle */}
      <div className="absolute inset-y-0 right-0 w-2 cursor-col-resize" />
    </div>
  )
}
