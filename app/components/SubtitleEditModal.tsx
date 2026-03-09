'use client'

import { useState } from 'react'

// Subtitle type - exported for use in EditPage
export interface Subtitle {
  id: string
  text: string
  startTime?: number  // DB field (seconds)
  endTime?: number    // DB field (seconds)
  start?: number     // UI field (milliseconds) - required
  end?: number       // UI field (milliseconds) - required
  style?: string
  animation?: string
  position?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string | null
  isBold?: boolean
  highlight?: boolean
  width?: string
}

interface SubtitleEditModalProps {
  subtitle: Subtitle
  currentIndex: number
  totalCount: number
  onClose: () => void
  onSave: (subtitle: Subtitle) => void
  onDelete: (id: string) => void
  onPrev: () => void
  onNext: () => void
}

export default function SubtitleEditModal({
  subtitle,
  currentIndex,
  totalCount,
  onClose,
  onSave,
  onDelete,
  onPrev,
  onNext,
}: SubtitleEditModalProps) {
  const [editedSubtitle, setEditedSubtitle] = useState<Subtitle>(subtitle)
  const [isPlaying, setIsPlaying] = useState(false)

  const formatTime = (ms: number | undefined) => {
    if (ms === undefined) return '00:00.000'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
  }

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/^(\d{2}):(\d{2})\.(\d{3})$/)
    if (!match) return 0
    const [, minutes, seconds, ms] = match
    return parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(ms)
  }

  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    const time = parseTime(value)
    setEditedSubtitle(prev => ({ ...prev, [field]: time }))
  }

  const duration = (editedSubtitle.end ?? 0) - (editedSubtitle.start ?? 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-test-id="subtitle-edit-modal">
      <div className="bg-[#2c1e16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">subtitles</span>
            <h2 className="text-lg font-bold text-white">字幕詳細編集</h2>
            <div className="flex items-center gap-2 ml-4 text-sm">
              <span className="text-white/50">#</span>
              <span className="text-white font-bold">{currentIndex + 1}</span>
              <span className="text-white/50">/ {totalCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
              data-test-id="subtitle-edit-prev-button"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalCount - 1}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
              data-test-id="subtitle-edit-next-button"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              data-test-id="subtitle-edit-close-button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Left: Preview */}
          <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/10">
            <div
              className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4"
              data-test-id="subtitle-edit-preview"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
              {/* Subtitle overlay */}
              <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                <div className="inline-block px-4 py-2 bg-black/70 rounded-lg">
                  <p className="text-white text-lg font-bold" style={{
                    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
                  }}>
                    {editedSubtitle.text}
                  </p>
                </div>
              </div>
              {/* Play button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                data-test-id="subtitle-edit-play-button"
              >
                <div className="size-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </div>
              </button>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-full py-2 text-sm text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              この字幕を再生
            </button>
          </div>

          {/* Right: Edit Form */}
          <div className="md:w-1/2 p-6 space-y-6">
            {/* Text */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                字幕テキスト
              </label>
              <div className="relative">
                <textarea
                  value={editedSubtitle.text}
                  onChange={(e) => setEditedSubtitle(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white resize-none focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none"
                  rows={3}
                  maxLength={40}
                  data-test-id="subtitle-edit-textarea"
                />
                <div className="absolute bottom-2 right-3 text-xs text-white/50" data-test-id="subtitle-edit-char-count">
                  {editedSubtitle.text.length} / 40文字
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 text-xs text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5">B</button>
                <button className="px-3 py-1 text-xs text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5">色</button>
                <button className="px-3 py-1 text-xs text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5">大</button>
                <button className="px-3 py-1 text-xs text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5">小</button>
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">開始時間</label>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input
                    type="text"
                    value={formatTime(editedSubtitle.start ?? 0)}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
                    data-test-id="subtitle-edit-start-time"
                  />
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">終了時間</label>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input
                    type="text"
                    value={formatTime(editedSubtitle.end ?? 0)}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
                    data-test-id="subtitle-edit-end-time"
                  />
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-white/50">
              長さ: {(duration / 1000).toFixed(2)}秒
            </div>

            {/* Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">スタイル</label>
                <select
                  value={editedSubtitle.style || 'standard'}
                  onChange={(e) => setEditedSubtitle(prev => ({ ...prev, style: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                  data-test-id="subtitle-edit-style-select"
                >
                  <option value="standard">標準</option>
                  <option value="emphasis">強調</option>
                  <option value="whisper">ささやき</option>
                  <option value="shout">叫び</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">アニメーション</label>
                <select
                  value={editedSubtitle.animation || 'none'}
                  onChange={(e) => setEditedSubtitle(prev => ({ ...prev, animation: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                  data-test-id="subtitle-edit-animation-select"
                >
                  <option value="none">なし</option>
                  <option value="fadein">フェードイン</option>
                  <option value="bounce">バウンス</option>
                  <option value="typewriter">タイプライター</option>
                </select>
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">配置</label>
              <div className="grid grid-cols-3 gap-2 w-32" data-test-id="subtitle-edit-position-grid">
                {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setEditedSubtitle(prev => ({ ...prev, position: pos }))}
                    className={`aspect-square rounded-lg border transition-colors ${
                      (editedSubtitle.position || 'bottom-center') === pos
                        ? 'bg-primary border-primary'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {(editedSubtitle.position || 'bottom-center') === pos && (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#231810]">
          <button
            onClick={() => onDelete(editedSubtitle.id)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            data-test-id="subtitle-edit-delete-button"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            削除
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              data-test-id="subtitle-edit-cancel-button"
            >
              キャンセル
            </button>
            <button
              onClick={() => onSave(editedSubtitle)}
              className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 transition-colors"
              data-test-id="subtitle-edit-save-button"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
