'use client'

import { useState } from 'react'

interface ExportSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (settings: ExportSettings) => void
  projectId: string
  projectName: string
  duration: number
}

interface ExportSettings {
  quality: '720p' | '1080p' | '4k'
  format: 'mp4' | 'webm' | 'mov'
  includeSubtitles: boolean
  subtitleFormat: 'burn-in' | 'srt' | 'both'
  includeThumbnail: boolean
  watermark: boolean
}

export default function ExportSettingsModal({
  isOpen,
  onClose,
  onExport,
  projectId,
  projectName,
  duration,
}: ExportSettingsModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    quality: '720p',
    format: 'mp4',
    includeSubtitles: true,
    subtitleFormat: 'burn-in',
    includeThumbnail: true,
    watermark: false,
  })
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const qualityOptions = [
    { value: '720p', label: '720p HD', description: '1280×720', pro: false },
    { value: '1080p', label: '1080p FHD', description: '1920×1080', pro: true },
    { value: '4k', label: '4K Ultra HD', description: '3840×2160', pro: true },
  ]

  const formatOptions = [
    { value: 'mp4', label: 'MP4', description: '汎用性が高い' },
    { value: 'webm', label: 'WebM', description: 'Web最適化' },
    { value: 'mov', label: 'MOV', description: '高品質' },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(settings)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        data-test-id="modal-backdrop"
      />

      {/* Modal */}
      <div className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-[#1a1614] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">file_export</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">書き出し設定</h2>
              <p className="text-sm text-slate-500">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            data-test-id="close-modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Quality Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">high_quality</span>
              画質
            </label>
            <div className="grid grid-cols-3 gap-3">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, quality: option.value as ExportSettings['quality'] })}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    settings.quality === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  data-test-id={`quality-${option.value}`}
                >
                  <div className="font-bold text-slate-900 dark:text-white">{option.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                  {option.pro && (
                    <span className="absolute top-2 right-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                      PRO
                    </span>
                  )}
                  {settings.quality === option.value && (
                    <span className="material-symbols-outlined absolute bottom-2 right-2 text-primary">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">video_file</span>
              フォーマット
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, format: option.value as ExportSettings['format'] })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.format === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  data-test-id={`format-${option.value}`}
                >
                  <div className="font-bold text-slate-900 dark:text-white">{option.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle Options */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">subtitles</span>
              字幕オプション
            </label>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">字幕を含める</div>
                  <div className="text-sm text-slate-500">動画に字幕を追加</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.includeSubtitles}
                  onChange={(e) => setSettings({ ...settings, includeSubtitles: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  data-test-id="include-subtitles"
                />
              </label>

              {settings.includeSubtitles && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">字幕形式</div>
                  <div className="flex gap-2">
                    {[
                      { value: 'burn-in', label: '動画に焼き込み' },
                      { value: 'srt', label: 'SRTファイル' },
                      { value: 'both', label: '両方' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setSettings({ ...settings, subtitleFormat: option.value as ExportSettings['subtitleFormat'] })
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.subtitleFormat === option.value
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                        }`}
                        data-test-id={`subtitle-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              その他のオプション
            </label>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">サムネイル画像</div>
                  <div className="text-sm text-slate-500">最初のフレームをPNGで出力</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.includeThumbnail}
                  onChange={(e) => setSettings({ ...settings, includeThumbnail: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  data-test-id="include-thumbnail"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">ウォーターマーク</div>
                  <div className="text-sm text-slate-500">SakuEditロゴを追加</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.watermark}
                  onChange={(e) => setSettings({ ...settings, watermark: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                  data-test-id="include-watermark"
                />
              </label>
            </div>
          </div>

          {/* Estimated Size */}
          <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">info</span>
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">推定ファイルサイズ</div>
                <div className="text-xs text-slate-500">動画時間: {formatDuration(duration)}</div>
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              ~{Math.round(duration * (settings.quality === '4k' ? 50 : settings.quality === '1080p' ? 20 : 10))}MB
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
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test-id="export-button"
          >
            {isExporting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                書き出し中...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                書き出し開始
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
