'use client'

import { useState } from 'react'

interface ExportModalProps {
  onClose: () => void
  onExport: (settings: ExportSettings) => void
  isPro?: boolean
}

interface ExportSettings {
  quality: '720p' | '1080p' | '4k'
  format: 'mp4' | 'webm' | 'mov'
  subtitleOption: 'burn' | 'srt' | 'both'
  removeWatermark: boolean
  exportThumbnail: boolean
}

export default function ExportModal({ onClose, onExport, isPro = false }: ExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    quality: '720p',
    format: 'mp4',
    subtitleOption: 'burn',
    removeWatermark: false,
    exportThumbnail: false,
  })

  const qualityOptions = [
    { id: '720p', label: '720p HD', size: '~45MB', pro: false },
    { id: '1080p', label: '1080p Full HD', size: '~120MB', pro: true, recommended: true },
    { id: '4k', label: '4K Ultra HD', size: '~400MB', pro: true },
  ]

  const formatOptions = [
    { id: 'mp4', label: 'MP4' },
    { id: 'webm', label: 'WebM' },
    { id: 'mov', label: 'MOV' },
  ]

  const subtitleOptions = [
    { id: 'burn', label: '動画に焼き込む' },
    { id: 'srt', label: '別ファイルで出力(SRT)' },
    { id: 'both', label: '両方' },
  ]

  const handleQualityChange = (quality: '720p' | '1080p' | '4k') => {
    if (quality !== '720p' && !isPro) return
    setSettings(prev => ({ ...prev, quality }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-test-id="export-modal">
      <div className="bg-[#2c1e16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <h2 className="text-lg font-bold text-white">書き出し設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            data-test-id="export-modal-close-button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">解像度</label>
            <div className="space-y-2">
              {qualityOptions.map((option) => {
                const isDisabled = option.pro && !isPro
                const isSelected = settings.quality === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => handleQualityChange(option.id as typeof settings.quality)}
                    disabled={isDisabled}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-white'
                        : isDisabled
                        ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                    }`}
                    data-test-id={`export-quality-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-white/30'
                      }`}>
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-xs">check</span>
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                      {option.recommended && (
                        <span className="text-[10px] bg-primary/30 text-primary px-2 py-0.5 rounded">推奨</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">{option.size}</span>
                      {option.pro && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">PRO</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Format & Subtitle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">フォーマット</label>
              <select
                value={settings.format}
                onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as typeof settings.format }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                data-test-id="export-format-select"
              >
                {formatOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">字幕</label>
              <select
                value={settings.subtitleOption}
                onChange={(e) => setSettings(prev => ({ ...prev, subtitleOption: e.target.value as typeof settings.subtitleOption }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {subtitleOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Watermark */}
            <label className={`flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl ${!isPro ? 'opacity-60' : 'cursor-pointer hover:bg-white/10'}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/70">watermark</span>
                <div>
                  <p className="text-sm text-white">ウォーターマークを削除</p>
                  {!isPro && (
                    <p className="text-xs text-primary">PROにアップグレード</p>
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.removeWatermark}
                disabled={!isPro}
                onChange={(e) => setSettings(prev => ({ ...prev, removeWatermark: e.target.checked }))}
                className="size-5 rounded border-white/30 bg-white/5 text-primary focus:ring-primary"
                data-test-id="export-watermark-checkbox"
              />
            </label>

            {/* Thumbnail */}
            <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/70">image</span>
                <div>
                  <p className="text-sm text-white">サムネイルも書き出す</p>
                  <p className="text-xs text-white/50">JPG形式で出力</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.exportThumbnail}
                onChange={(e) => setSettings(prev => ({ ...prev, exportThumbnail: e.target.checked }))}
                className="size-5 rounded border-white/30 bg-white/5 text-primary focus:ring-primary"
                data-test-id="export-thumbnail-checkbox"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#231810]">
          <p className="text-sm text-white/50">
            予想時間: <span className="text-white font-medium">約2分30秒</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              data-test-id="export-cancel-button"
            >
              キャンセル
            </button>
            <button
              onClick={() => onExport(settings)}
              className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 transition-colors"
              data-test-id="export-start-button"
            >
              書き出しを開始
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
