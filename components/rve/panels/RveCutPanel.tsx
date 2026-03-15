'use client'

import { useCallback, useMemo, useState } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'
import { getDimensionsForAspectRatio } from '@/app/reactvideoeditor/pro/utils/aspect-ratio-transform'
import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type { ClipOverlay } from '@/app/reactvideoeditor/pro/types'
import { applySilenceCut, removeSilenceCut, rebuildCaptionOverlays, type SubtitleData } from '@/lib/rve-bridge'
import { EDITOR_FPS, type SilenceRegion } from '@/lib/editor'
import { Button } from '@/app/reactvideoeditor/pro/components/ui/button'
import { Scissors, Undo2, Loader2, RefreshCw, Subtitles } from 'lucide-react'

export function RveCutPanel() {
  const { overlays, changeOverlay, setOverlays, aspectRatio } = useEditorContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isReloadingSubtitles, setIsReloadingSubtitles] = useState(false)
  const [silenceRegions, setSilenceRegions] = useState<SilenceRegion[] | null>(null)

  const videoOverlay = useMemo(
    () => overlays.find((o): o is ClipOverlay => o.type === OverlayType.VIDEO),
    [overlays],
  )

  const captionCount = useMemo(
    () => overlays.filter((o) => o.type === OverlayType.CAPTION).length,
    [overlays],
  )

  const hasSilenceCut = Boolean(videoOverlay?.segments?.length)

  const detectSilence = useCallback(async () => {
    if (!videoOverlay) return
    setIsLoading(true)
    try {
      const projectId = window.location.pathname.split('/edit/')[1]
      if (!projectId) return
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      const video = data.project?.videos?.[0]
      if (!video?.silenceDetected) return
      const regions: SilenceRegion[] = (video.silenceDetected as Array<{ start: number; end: number }>).map(
        (r: { start: number; end: number }) => ({ start: r.start, end: r.end }),
      )
      setSilenceRegions(regions)
    } finally {
      setIsLoading(false)
    }
  }, [videoOverlay])

  const handleApplyCut = useCallback(() => {
    if (!videoOverlay || !silenceRegions) return
    const updated = applySilenceCut(videoOverlay, silenceRegions, EDITOR_FPS)
    changeOverlay(videoOverlay.id, () => updated)
  }, [videoOverlay, silenceRegions, changeOverlay])

  const handleRemoveCut = useCallback(() => {
    if (!videoOverlay) return
    const updated = removeSilenceCut(videoOverlay)
    changeOverlay(videoOverlay.id, () => updated)
    setSilenceRegions(null)
  }, [videoOverlay, changeOverlay])

  const handleReloadSubtitles = useCallback(async () => {
    setIsReloadingSubtitles(true)
    try {
      const projectId = window.location.pathname.split('/edit/')[1]
      if (!projectId) return

      const res = await fetch(`/api/projects/${projectId}/subtitles`)
      if (!res.ok) return

      const data = await res.json()
      const subtitles: SubtitleData[] = (data.subtitles ?? []).map(
        (s: { text: string; startTime: number; endTime: number; position?: string }) => ({
          text: s.text,
          startTime: s.startTime,
          endTime: s.endTime,
          position: (s.position as 'top' | 'center' | 'bottom') ?? 'bottom',
        }),
      )

      if (subtitles.length === 0) return

      const canvas = getDimensionsForAspectRatio(aspectRatio)
      const newOverlays = rebuildCaptionOverlays(subtitles, overlays, canvas)
      setOverlays(newOverlays)
    } finally {
      setIsReloadingSubtitles(false)
    }
  }, [overlays, aspectRatio, setOverlays])

  if (!videoOverlay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Scissors className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">動画がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-1">
      {/* 無音カット */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium mb-2">無音カット</h4>
        <p className="text-xs text-muted-foreground mb-4">
          動画内の無音部分を自動検出してカットします。
        </p>

        {hasSilenceCut ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Scissors className="h-4 w-4" />
              <span>無音カット適用済み ({videoOverlay.segments?.length} セグメント)</span>
            </div>
            <Button onClick={handleRemoveCut} variant="outline" size="sm" className="w-full">
              <Undo2 className="h-4 w-4 mr-1" />
              カットを解除
            </Button>
          </div>
        ) : silenceRegions ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {silenceRegions.length} 箇所の無音区間を検出
            </p>
            <Button onClick={handleApplyCut} size="sm" className="w-full">
              <Scissors className="h-4 w-4 mr-1" />
              無音部分をカット
            </Button>
          </div>
        ) : (
          <Button
            onClick={detectSilence}
            size="sm"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Scissors className="h-4 w-4 mr-1" />
            )}
            無音区間を検出
          </Button>
        )}
      </div>

      {/* 字幕再読み込み */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium mb-2">字幕管理</h4>
        <p className="text-xs text-muted-foreground mb-3">
          文字起こしデータからタイムラインの字幕を再読み込みします。
          {captionCount > 0 && ` 現在 ${captionCount} 件の字幕`}
        </p>
        <Button
          onClick={handleReloadSubtitles}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isReloadingSubtitles}
        >
          {isReloadingSubtitles ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : captionCount > 0 ? (
            <RefreshCw className="h-4 w-4 mr-1" />
          ) : (
            <Subtitles className="h-4 w-4 mr-1" />
          )}
          {captionCount > 0 ? '字幕を再読み込み' : '文字起こしから字幕を取得'}
        </Button>
      </div>
    </div>
  )
}
