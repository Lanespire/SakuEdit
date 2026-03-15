'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'
import { getDimensionsForAspectRatio } from '@/app/reactvideoeditor/pro/utils/aspect-ratio-transform'
import { OverlayType } from '@/app/reactvideoeditor/pro/types'
import type { Overlay, TextOverlay, SoundOverlay, CaptionOverlay } from '@/app/reactvideoeditor/pro/types'
import { EDITOR_FPS } from '@/lib/editor'
import { Button } from '@/app/reactvideoeditor/pro/components/ui/button'
import { Bot, Send, Loader2 } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface OverlayOperation {
  op: 'add' | 'update' | 'delete' | 'update_style'
  overlayId?: number
  overlayType?: string
  fields?: Record<string, unknown>
}

function getMaxId(overlays: Overlay[]): number {
  return overlays.reduce((max, o) => Math.max(max, o.id), 0)
}

function applyOperations(
  overlays: Overlay[],
  operations: OverlayOperation[],
  canvas: { width: number; height: number },
): Overlay[] {
  let result = [...overlays]
  let nextId = getMaxId(result) + 1

  for (const op of operations) {
    switch (op.op) {
      case 'add': {
        const fields = op.fields ?? {}
        const from = typeof fields.from === 'number' ? fields.from : 0
        const dur = typeof fields.durationInFrames === 'number' ? fields.durationInFrames : EDITOR_FPS * 5
        const width = typeof fields.width === 'number' ? fields.width : Math.round(canvas.width * 0.5)
        const height = typeof fields.height === 'number' ? fields.height : 60
        const left = typeof fields.left === 'number' ? fields.left : Math.round((canvas.width - width) / 2)
        const top = typeof fields.top === 'number' ? fields.top : Math.round((canvas.height - height) / 2)

        const base = {
          id: nextId++,
          from,
          durationInFrames: dur,
          left,
          top,
          width,
          height,
          row: typeof fields.row === 'number' ? fields.row : 1,
          rotation: 0,
          isDragging: false,
        }

        if (op.overlayType === 'text' || op.overlayType === OverlayType.TEXT) {
          result.push({
            ...base,
            type: OverlayType.TEXT,
            content: (fields.content as string) ?? 'テキスト',
            styles: {
              fontSize: '36px',
              fontWeight: '500',
              color: '#FFFFFF',
              backgroundColor: 'transparent',
              fontFamily: 'Noto Sans JP, sans-serif',
              fontStyle: 'normal',
              textDecoration: 'none',
              textAlign: 'center',
              opacity: 1,
              ...(fields.styles as Record<string, unknown> ?? {}),
            },
          } as TextOverlay)
        } else if (op.overlayType === 'sound' || op.overlayType === OverlayType.SOUND) {
          result.push({
            ...base,
            type: OverlayType.SOUND,
            content: (fields.src as string) ?? '',
            src: (fields.src as string) ?? '',
            left: 0, top: 0, width: 0, height: 0,
            row: 2,
            styles: { volume: 1, ...(fields.styles as Record<string, unknown> ?? {}) },
          } as SoundOverlay)
        } else if (op.overlayType === 'caption' || op.overlayType === OverlayType.CAPTION) {
          result.push({
            ...base,
            type: OverlayType.CAPTION,
            captions: (fields.captions as CaptionOverlay['captions']) ?? [],
            styles: fields.styles as CaptionOverlay['styles'],
            template: (fields.template as string) ?? 'classic',
          } as CaptionOverlay)
        }
        break
      }
      case 'update': {
        if (op.overlayId == null || !op.fields) break
        result = result.map((o) =>
          o.id === op.overlayId ? { ...o, ...op.fields } as Overlay : o,
        )
        break
      }
      case 'update_style': {
        if (op.overlayId == null || !op.fields?.styles) break
        const styleUpdates = op.fields.styles as Record<string, unknown>
        result = result.map((o) => {
          if (o.id !== op.overlayId) return o
          return { ...o, styles: { ...o.styles, ...styleUpdates } } as Overlay
        })
        break
      }
      case 'delete': {
        if (op.overlayId == null) break
        result = result.filter((o) => o.id !== op.overlayId)
        break
      }
    }
  }

  return result
}

export function RveAiPanel() {
  const { overlays, setOverlays, aspectRatio, fps } = useEditorContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return

      setInput('')
      const chatHistory = messages.slice(-10)
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setIsLoading(true)

      try {
        const projectId = window.location.pathname.split('/edit/')[1]
        if (!projectId) throw new Error('プロジェクトIDが見つかりません')

        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            overlays,
            aspectRatio,
            fps,
            chatHistory,
          }),
        })

        if (!res.ok) throw new Error('AI応答に失敗しました')

        const data = await res.json()
        const operations: OverlayOperation[] = data.operations ?? []

        // Apply operations to overlays
        if (operations.length > 0) {
          const canvas = getDimensionsForAspectRatio(aspectRatio)
          const newOverlays = applyOperations(overlays, operations, canvas)
          setOverlays(newOverlays)
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message || 'OK' },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, overlays, aspectRatio, fps, messages, setOverlays],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-1 mb-2">
        <p className="text-xs text-muted-foreground">
          AIに自然言語で編集指示を出せます。「テロップを追加して」「字幕を大きくして」「無音部分をカットして」など。
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bot className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">AIアシスタント</p>
            <p className="text-xs mt-1">編集に関する指示を入力してください</p>
          </div>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 text-sm ${
              message.role === 'user'
                ? 'bg-primary/10 text-foreground ml-6'
                : 'bg-card border border-border mr-6'
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            考え中...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-border mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="編集指示を入力..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
