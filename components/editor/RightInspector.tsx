'use client'

import { useState } from 'react'
import IntegratedEditorPanel, { type EditorPanelTab } from '@/components/editor/IntegratedEditorPanel'
import PropertyPanel from '@/components/editor/PropertyPanel'
import type { Subtitle } from '@/components/modals'
import type {
  EditorAISuggestion,
  EditorMarker,
  SubtitleDisplayMode,
} from '@/lib/editor'
import type { AIChatMessage } from '@/lib/stores/editor-ui-store'
import type { TrackName } from '@/lib/composition-data'
import { Settings } from 'lucide-react'

type InspectorTab = 'selected' | 'ai' | 'subtitle' | 'marker' | 'display'

const tabItems: { id: InspectorTab; label: string; icon: string }[] = [
  { id: 'selected', label: '選択中', icon: 'tune' },
  { id: 'ai', label: 'AI', icon: 'auto_awesome' },
  { id: 'subtitle', label: '字幕', icon: 'subtitles' },
  { id: 'marker', label: '見どころ', icon: 'flag' },
  { id: 'display', label: '表示', icon: 'settings' },
]

export interface RightInspectorProps {
  // PropertyPanel props
  selectedItem: Record<string, unknown> | null
  selectedTrack: TrackName | null
  onUpdateItem: (track: TrackName, itemId: string, fields: Record<string, unknown>) => void

  // IntegratedEditorPanel props
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
  onSendCompositionChat?: (message: string) => void
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

export default function RightInspector(props: RightInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('ai')

  // 選択中アイテムがある場合は自動的に「選択中」タブを表示候補にする
  const hasSelection = props.selectedItem !== null && props.selectedTrack !== null

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#15100d]">
      {/* タブバー */}
      <div className="flex shrink-0 border-b border-[#2c201b]">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            type="button"
            title={tab.label}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-orange-400 text-orange-300'
                : 'text-white/40 hover:text-white/60'
            } ${tab.id === 'selected' && hasSelection ? 'relative' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
            {/* 選択中アイテムがある場合のインジケーター */}
            {tab.id === 'selected' && hasSelection && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
            )}
          </button>
        ))}
      </div>

      {/* コンテンツエリア */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'selected' ? (
          <div className="h-full overflow-y-auto">
            {hasSelection ? (
              <PropertyPanel
                selectedItem={props.selectedItem}
                selectedTrack={props.selectedTrack}
                onUpdateItem={props.onUpdateItem}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center text-sm text-white/40">
                <Settings className="mb-2 h-8 w-8 text-white/20" />
                <p>アイテムを選択してプロパティを編集</p>
              </div>
            )}
          </div>
        ) : (
          <IntegratedEditorPanel
            subtitles={props.subtitles}
            markers={props.markers}
            suggestions={props.suggestions}
            messages={props.messages}
            selectedSubtitleId={props.selectedSubtitleId}
            playheadSeconds={props.playheadSeconds}
            zoomLevel={props.zoomLevel}
            cutApplied={props.cutApplied}
            styleName={props.styleName}
            subtitleDisplayMode={props.subtitleDisplayMode}
            subtitleIntervalSeconds={props.subtitleIntervalSeconds}
            playbackRate={props.playbackRate}
            onSendPrompt={props.onSendPrompt}
            onSendCompositionChat={props.onSendCompositionChat}
            onApplySuggestion={props.onApplySuggestion}
            onPreviewSuggestion={props.onPreviewSuggestion}
            onZoomChange={props.onZoomChange}
            onSelectSubtitle={props.onSelectSubtitle}
            onEditSubtitle={props.onEditSubtitle}
            onJumpToMarker={props.onJumpToMarker}
            onResetPlaybackRate={props.onResetPlaybackRate}
            onAddSubtitle={props.onAddSubtitle}
            onOpenStyle={props.onOpenStyle}
            onSubtitleDisplayModeChange={props.onSubtitleDisplayModeChange}
            onSubtitleIntervalSecondsChange={props.onSubtitleIntervalSecondsChange}
            initialTab={activeTab as EditorPanelTab}
          />
        )}
      </div>
    </div>
  )
}
