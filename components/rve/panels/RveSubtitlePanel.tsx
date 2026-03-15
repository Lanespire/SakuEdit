'use client'

import { useMemo } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'
import { useRveBridge } from '@/lib/rve-bridge'
import type { CaptionOverlay } from '@/app/reactvideoeditor/pro/types'
import { Button } from '@/app/reactvideoeditor/pro/components/ui/button'
import { Plus, Edit3, Subtitles } from 'lucide-react'

function formatMs(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = ms % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export function RveSubtitlePanel() {
  const { selectedOverlayId, setSelectedOverlayId } = useEditorContext()
  const { captionOverlays, addSubtitle, removeSubtitle } = useRveBridge()

  const allCaptions = useMemo(() => {
    return captionOverlays.flatMap((overlay: CaptionOverlay) =>
      overlay.captions.map((caption) => ({
        ...caption,
        overlayId: overlay.id,
      })),
    )
  }, [captionOverlays])

  const handleAddCaption = () => {
    addSubtitle({
      text: '新しい字幕',
      startTime: 0,
      endTime: 3,
      position: 'bottom',
    })
  }

  if (allCaptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Subtitles className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm mb-4">字幕がありません</p>
        <Button onClick={handleAddCaption} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          字幕を追加
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{allCaptions.length} 件の字幕</p>
        <Button onClick={handleAddCaption} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          追加
        </Button>
      </div>
      {allCaptions.map((caption, index) => {
        const isSelected = caption.overlayId === selectedOverlayId
        return (
          <button
            key={`${caption.overlayId}-${index}`}
            onClick={() => setSelectedOverlayId(caption.overlayId)}
            className={`group w-full text-left rounded-lg border p-3 transition-colors ${
              isSelected
                ? 'border-primary/40 bg-primary/10'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{caption.text}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="font-mono">
                    {formatMs(caption.startMs)} - {formatMs(caption.endMs)}
                  </span>
                </div>
              </div>
              <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
