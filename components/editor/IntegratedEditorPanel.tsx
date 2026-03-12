'use client'

import TextareaAutosize from 'react-textarea-autosize'
import { useMemo, useState } from 'react'
import type { Subtitle } from '@/components/modals'
import type {
  EditorAISuggestion,
  EditorMarker,
  SubtitleDisplayMode,
} from '@/lib/editor'
import type { AIChatMessage } from '@/lib/stores/editor-ui-store'

interface IntegratedEditorPanelProps {
  subtitles: Subtitle[]
  markers: EditorMarker[]
  suggestions: EditorAISuggestion[]
  messages: AIChatMessage[]
  selectedSubtitleId: string | null
  playheadSeconds: number
  zoomLevel: number
  cutApplied: boolean
  styleName?: string
  subtitleDisplayMode: SubtitleDisplayMode
  subtitleIntervalSeconds: number
  playbackRate: number
  onSendPrompt: (prompt: string) => void
  onApplySuggestion: (id: string) => void
  onPreviewSuggestion: (id: string) => void
  onZoomChange: (zoomLevel: number) => void
  onSelectSubtitle: (index: number) => void
  onEditSubtitle: (index: number) => void
  onJumpToMarker: (index: number) => void
  onResetPlaybackRate: () => void
  onAddSubtitle: () => void
  onOpenStyle: () => void
  onSubtitleDisplayModeChange: (mode: SubtitleDisplayMode) => void
  onSubtitleIntervalSecondsChange: (seconds: number) => void
}

type EditorPanelTab = 'ai' | 'subtitle' | 'marker' | 'display'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function IconButton({
  title,
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  title: string
  icon: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-10 items-center justify-center rounded-xl border transition-colors ${
        disabled
          ? 'cursor-not-allowed border-[#2e221c] bg-[#16110e] text-white/20'
          : active
            ? 'border-primary/55 bg-primary/16 text-white'
            : 'border-[#34251f] bg-[#19120f] text-[#d8c0ae] hover:border-[#7d593d] hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  )
}

function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {meta ? <span className="text-[11px] text-white/40">{meta}</span> : null}
    </div>
  )
}

export default function IntegratedEditorPanel({
  subtitles,
  markers,
  suggestions,
  messages,
  selectedSubtitleId,
  playheadSeconds,
  zoomLevel,
  cutApplied,
  styleName,
  subtitleDisplayMode,
  subtitleIntervalSeconds,
  playbackRate,
  onSendPrompt,
  onApplySuggestion,
  onPreviewSuggestion,
  onZoomChange,
  onSelectSubtitle,
  onEditSubtitle,
  onJumpToMarker,
  onResetPlaybackRate,
  onAddSubtitle,
  onOpenStyle,
  onSubtitleDisplayModeChange,
  onSubtitleIntervalSecondsChange,
}: IntegratedEditorPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [activeTab, setActiveTab] = useState<EditorPanelTab>('ai')

  const currentSubtitleIndex = useMemo(
    () => subtitles.findIndex((subtitle) => subtitle.id === selectedSubtitleId),
    [selectedSubtitleId, subtitles],
  )
  const effectiveSubtitleIndex = currentSubtitleIndex >= 0 ? currentSubtitleIndex : 0
  const currentSubtitle = subtitles[effectiveSubtitleIndex] ?? null
  const recentPrompt = messages.filter((message) => message.role === 'user').at(-1)
  const subtitleModeOptions: Array<{ value: SubtitleDisplayMode; label: string; icon: string }> = [
    { value: 'phrase', label: '文節', icon: 'short_text' },
    { value: 'single-line', label: '1行', icon: 'notes' },
    { value: 'interval', label: '秒', icon: 'timer' },
  ]
  const intervalOptions = [1, 1.5, 2, 3]
  const highlightSuggestions = suggestions.filter((suggestion) => suggestion.type === 'highlight-detect')
  const tabItems: Array<{ id: EditorPanelTab; label: string; icon: string }> = [
    { id: 'ai', label: 'AI', icon: 'auto_awesome' },
    { id: 'subtitle', label: '字幕', icon: 'subtitles' },
    { id: 'marker', label: '見どころ', icon: 'flag' },
    { id: 'display', label: '表示', icon: 'tune' },
  ]

  const handleSubmitPrompt = () => {
    const nextPrompt = prompt.trim()
    if (!nextPrompt) {
      return
    }

    onSendPrompt(nextPrompt)
    setPrompt('')
  }

  const renderContent = () => {
    if (activeTab === 'ai') {
      return (
        <div className="space-y-3">
          <SectionTitle title="AI" />

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmitPrompt()
            }}
          >
            <div className="rounded-2xl border border-[#4d3728] bg-[#fff7ee] p-3 shadow-[0_0_0_1px_rgba(255,185,119,0.08)]">
              <TextareaAutosize
                minRows={3}
                maxRows={7}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例: 無音カットして最初の見どころへ"
                className="w-full resize-none bg-transparent text-sm leading-6 text-[#2d1f17] outline-none placeholder:text-[#8e6a4c]"
              />
            </div>

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined mr-1 text-[16px]">play_arrow</span>
              実行
            </button>
          </form>

          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="rounded-2xl border border-[#34251f] bg-[#19120f] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium text-white">{suggestion.title}</div>
                  <div className="flex items-center gap-1">
                    <IconButton title="適用" icon="play_arrow" onClick={() => onApplySuggestion(suggestion.id)} />
                    <IconButton title="位置を見る" icon="visibility" onClick={() => onPreviewSuggestion(suggestion.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recentPrompt ? (
            <div className="rounded-2xl border border-[#34251f] bg-[#19120f] px-3 py-2 text-xs text-[#d8c0ae]">
              {recentPrompt.content}
            </div>
          ) : null}
        </div>
      )
    }

    if (activeTab === 'subtitle') {
      return (
        <div className="space-y-3">
          <SectionTitle title="字幕" meta={currentSubtitle ? `${effectiveSubtitleIndex + 1}/${subtitles.length}` : undefined} />

          <div className="rounded-2xl border border-[#34251f] bg-[#19120f] p-3">
            {currentSubtitle ? (
              <>
                <div className="line-clamp-4 text-sm leading-6 text-white">{currentSubtitle.text}</div>
                <div className="mt-2 text-[11px] text-white/45">
                  {formatSeconds(currentSubtitle.startTime ?? 0)} - {formatSeconds(currentSubtitle.endTime ?? 0)}
                </div>
              </>
            ) : (
              <div className="text-sm text-white/45">字幕なし</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <IconButton title="追加" icon="add" onClick={onAddSubtitle} />
            <IconButton
              title="編集"
              icon="edit"
              onClick={() => onEditSubtitle(effectiveSubtitleIndex)}
              disabled={!currentSubtitle}
            />
            <IconButton
              title="前へ"
              icon="chevron_left"
              onClick={() => onSelectSubtitle(Math.max(0, effectiveSubtitleIndex - 1))}
              disabled={effectiveSubtitleIndex <= 0}
            />
            <IconButton
              title="次へ"
              icon="chevron_right"
              onClick={() => onSelectSubtitle(Math.min(subtitles.length - 1, effectiveSubtitleIndex + 1))}
              disabled={effectiveSubtitleIndex >= subtitles.length - 1}
            />
          </div>
        </div>
      )
    }

    if (activeTab === 'marker') {
      return (
        <div className="space-y-3">
          <SectionTitle title="見どころ" meta={`${markers.length}`} />

          <div className="space-y-2">
            {markers.length > 0 ? markers.map((marker, index) => (
              <button
                key={marker.id}
                type="button"
                onClick={() => onJumpToMarker(index)}
                className="flex h-10 w-full items-center justify-between rounded-xl border px-3 text-left text-sm text-white transition-colors hover:border-white/25"
                style={{ borderColor: `${marker.color}55`, backgroundColor: `${marker.color}14` }}
              >
                <span className="truncate">{marker.label ?? `Marker ${index + 1}`}</span>
                <span className="material-symbols-outlined text-[16px] opacity-70">north_east</span>
              </button>
            )) : (
              <div className="rounded-2xl border border-[#34251f] bg-[#19120f] px-3 py-2 text-sm text-white/45">
                マーカーなし
              </div>
            )}
          </div>

          {highlightSuggestions.length > 0 ? (
            <button
              type="button"
              onClick={() => onApplySuggestion(highlightSuggestions[0].id)}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-[#4c3829] bg-[#211814] text-sm font-medium text-white transition-colors hover:border-[#8e6543]"
            >
              <span className="material-symbols-outlined mr-1 text-[16px]">auto_awesome</span>
              抽出
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <SectionTitle title="表示" />

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {subtitleModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSubtitleDisplayModeChange(option.value)}
                title={option.label}
                className={`flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold transition-colors ${
                  subtitleDisplayMode === option.value
                    ? 'bg-primary text-white'
                    : 'border border-[#34251f] bg-[#19120f] text-[#d8c0ae] hover:border-[#7d593d] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {subtitleDisplayMode === 'interval' ? (
            <div className="flex flex-wrap gap-2">
              {intervalOptions.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => onSubtitleIntervalSecondsChange(seconds)}
                  className={`h-9 rounded-xl px-3 text-xs font-bold transition-colors ${
                    Math.abs(subtitleIntervalSeconds - seconds) < 0.05
                      ? 'bg-[#fff1e4] text-[#6f401c]'
                      : 'border border-[#34251f] bg-[#19120f] text-[#d8c0ae] hover:border-[#7d593d] hover:text-white'
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <IconButton title="縮小" icon="zoom_out" onClick={() => onZoomChange(clamp(Number((zoomLevel - 0.2).toFixed(2)), 0.5, 3))} />
          <IconButton title="フィット" icon="fit_screen" onClick={() => onZoomChange(1)} />
          <IconButton title="拡大" icon="zoom_in" onClick={() => onZoomChange(clamp(Number((zoomLevel + 0.2).toFixed(2)), 0.5, 3))} />
          <IconButton title="スタイル" icon="palette" onClick={onOpenStyle} />
        </div>
      </div>
    )
  }

  return (
    <aside className="flex h-full min-h-0 overflow-hidden rounded-[22px] border border-[#433028] bg-[#15100d] shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-[#2c201b] bg-[#120d0b] px-2 py-3">
        {tabItems.map((tab) => (
          <IconButton
            key={tab.id}
            title={tab.label}
            icon={tab.icon}
            onClick={() => setActiveTab(tab.id)}
            active={activeTab === tab.id}
          />
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#2c201b] px-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
            {activeTab}
          </div>
          {styleName ? <div className="truncate text-[11px] text-white/38">{styleName}</div> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {renderContent()}
        </div>

        <div className="border-t border-[#2c201b] bg-[#120d0b] px-3 py-2">
          <div className="flex flex-wrap gap-1.5 text-[11px] text-white/42">
            <div className="rounded-md bg-white/6 px-2 py-1">{formatSeconds(playheadSeconds)}</div>
            <div className="rounded-md bg-white/6 px-2 py-1">{playbackRate.toFixed(2)}x</div>
            <div className="rounded-md bg-white/6 px-2 py-1">{zoomLevel.toFixed(1)}x</div>
            <div className="rounded-md bg-white/6 px-2 py-1">{markers.length}</div>
            {playbackRate !== 1 ? (
              <button
                type="button"
                onClick={onResetPlaybackRate}
                className="rounded-md border border-[#34251f] bg-[#19120f] px-2 py-1 text-[11px] text-[#d8c0ae] transition-colors hover:border-[#7d593d] hover:text-white"
              >
                1x
              </button>
            ) : null}
            <div className="rounded-md bg-white/6 px-2 py-1">{cutApplied ? 'cut' : 'raw'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
