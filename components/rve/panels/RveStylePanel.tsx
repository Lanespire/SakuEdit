'use client'

import { useCallback, useMemo } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'
import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type { CaptionOverlay } from '@/app/reactvideoeditor/pro/types'
import { captionTemplates } from '@/app/reactvideoeditor/pro/templates/caption-templates'
import { Palette, Check } from 'lucide-react'

const STYLE_PRESETS = [
  { id: 'classic', label: 'クラシック', description: 'シンプルな白文字' },
  { id: 'minimal', label: 'ミニマル', description: '控えめなスタイル' },
  { id: 'hustle', label: 'ポップ', description: '太字でインパクト' },
  { id: 'neon', label: 'ネオン', description: '光る文字効果' },
  { id: 'retro', label: 'レトロ', description: 'レトロ風味' },
] as const

export function RveStylePanel() {
  const { overlays, changeOverlay } = useEditorContext()

  const captionOverlays = useMemo(
    () => overlays.filter((o): o is CaptionOverlay => o.type === OverlayType.CAPTION),
    [overlays],
  )

  const currentTemplate = captionOverlays[0]?.template ?? 'classic'

  const applyStyle = useCallback(
    (templateId: string) => {
      const template = captionTemplates[templateId as keyof typeof captionTemplates]
      if (!template) return

      for (const overlay of captionOverlays) {
        changeOverlay(overlay.id, (prev) => {
          if (prev.type !== OverlayType.CAPTION) return prev
          const captionPrev = prev as CaptionOverlay
          return {
            ...captionPrev,
            template: templateId,
            styles: {
              ...captionPrev.styles,
              ...template.styles,
            },
          } as CaptionOverlay
        })
      }
    },
    [captionOverlays, changeOverlay],
  )

  if (captionOverlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Palette className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">字幕がありません</p>
        <p className="text-xs mt-1">字幕を追加してからスタイルを設定できます</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <p className="text-sm text-muted-foreground mb-3">
        字幕スタイルを選択してください
      </p>
      <div className="grid gap-2">
        {STYLE_PRESETS.map((preset) => {
          const template = captionTemplates[preset.id as keyof typeof captionTemplates]
          const isActive = currentTemplate === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => applyStyle(preset.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                isActive
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{preset.label}</p>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </div>
              {template && (
                <div
                  className="mt-2 rounded px-2 py-1 text-xs truncate"
                  style={{
                    fontFamily: template.styles.fontFamily,
                    color: template.styles.color,
                    backgroundColor: template.styles.backgroundColor || 'transparent',
                    textShadow: template.styles.textShadow,
                    fontWeight: template.styles.fontWeight as number | undefined,
                  }}
                >
                  サンプルテキスト
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
