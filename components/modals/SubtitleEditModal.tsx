'use client'

import { useState } from 'react'

interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  style: 'default' | 'youtuber' | 'minimal' | 'bold' | 'outline'
}

interface SubtitleEditModalProps {
  subtitle: Subtitle
  isOpen: boolean
  onClose: () => void
  onSave: (subtitle: Subtitle) => void
  onNext: () => void
  onPrev: () => void
  currentIndex: number
  totalCount: number
}

export default function SubtitleEditModal({
  subtitle,
  isOpen,
  onClose,
  onSave,
  onNext,
  onPrev,
  currentIndex,
  totalCount,
}: SubtitleEditModalProps) {
  const [text, setText] = useState(subtitle.text)
  const [startTime, setStartTime] = useState(subtitle.startTime)
  const [endTime, setEndTime] = useState(subtitle.endTime)
  const [waveformEnabled, setWaveformEnabled] = useState(false)

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
  }

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\.?(\d+)?/)
    if (!match) return 0
    const mins = parseInt(match[1])
    const secs = parseInt(match[2])
    const ms = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2)) / 100 : 0
    return mins * 60 + secs + ms
  }

  const handleSave = () => {
    onSave({
      ...subtitle,
      text,
      startTime,
      endTime,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
        data-test-id="modal-backdrop"
      />

      {/* Modal */}
      <div className="pointer-events-auto w-full max-w-[1200px] bg-white dark:bg-[#1a1614] rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col h-[85vh] border-t border-white/10 relative transform transition-transform duration-300 ease-out">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-white/5 rounded-t-2xl transition-colors">
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">tune</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              字幕詳細編集
            </h2>
            <span className="text-slate-400 text-sm font-medium pt-1 border-l border-slate-200 dark:border-white/10 pl-4">
              #{currentIndex + 1} / {totalCount}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
              data-test-id="prev-subtitle"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">chevron_left</span>
              前
            </button>
            <button
              onClick={onNext}
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
              data-test-id="next-subtitle"
            >
              次
              <span className="material-symbols-outlined text-[18px] ml-1">chevron_right</span>
            </button>
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
              data-test-id="close-modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left: Preview */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">preview</span>
                  プレビュー
                </label>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 group shadow-md border border-slate-200 dark:border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
                  <div className="absolute inset-0 flex items-end justify-center pb-8 px-8">
                    <p className="text-white text-lg font-bold drop-shadow-md text-center leading-tight bg-black/40 px-2 py-1 rounded">
                      {text || '字幕プレビュー'}
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-primary text-white transition-colors shadow-lg">
                      <span className="material-symbols-outlined text-[28px]">play_arrow</span>
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 h-12 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-lg transition-colors border border-slate-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                  play_circle
                </span>
                <span>この字幕を再生</span>
              </button>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">graphic_eq</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    波形で微調整
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={waveformEnabled}
                    onChange={(e) => setWaveformEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Right: Edit Form */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Text Input */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">subtitles</span>
                    字幕テキスト
                  </label>
                  <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                    {text.length} / 40文字
                  </span>
                </div>
                <div className="relative group">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full min-h-[120px] p-4 text-lg leading-relaxed rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2420] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none resize-none transition-shadow font-medium"
                    placeholder="ここに字幕を入力..."
                    maxLength={40}
                    data-test-id="subtitle-text-input"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 rounded-lg p-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold" title="太字">
                      B
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
                    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400" title="文字色">
                      <span className="material-symbols-outlined text-[20px]">format_color_text</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400" title="サイズ">
                      <span className="material-symbols-outlined text-[20px]">format_size</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    開始時間
                  </label>
                  <input
                    type="text"
                    value={formatTime(startTime)}
                    onChange={(e) => setStartTime(parseTime(e.target.value))}
                    className="px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2420] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none font-mono"
                    data-test-id="start-time-input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    終了時間
                  </label>
                  <input
                    type="text"
                    value={formatTime(endTime)}
                    onChange={(e) => setEndTime(parseTime(e.target.value))}
                    className="px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2420] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none font-mono"
                    data-test-id="end-time-input"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    表示時間
                  </label>
                  <div className="px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1a1614] text-slate-500 dark:text-slate-400 font-mono">
                    {(endTime - startTime).toFixed(2)}秒
                  </div>
                </div>
              </div>

              {/* Position & Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    位置
                  </label>
                  <div className="flex gap-2">
                    {['top', 'middle', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          pos === 'bottom'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-primary/50'
                        }`}
                        data-test-id={`position-${pos}`}
                      >
                        {pos === 'top' ? '上' : pos === 'middle' ? '中' : '下'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    スタイル
                  </label>
                  <select
                    className="px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#2a2420] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none"
                    data-test-id="style-select"
                  >
                    <option value="default">デフォルト</option>
                    <option value="youtuber">YouTuber風</option>
                    <option value="minimal">ミニマル</option>
                    <option value="bold">太字</option>
                    <option value="outline">枠線</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-[#1a1614]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            data-test-id="cancel-button"
          >
            キャンセル
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors"
              data-test-id="save-subtitle"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
