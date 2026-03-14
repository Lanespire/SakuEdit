'use client'

import { Download, Image, FileText, X } from 'lucide-react'

interface ExportCompleteSheetProps {
  downloadUrl: string
  onClose: () => void
  onOpenThumbnailModal: () => void
  hasSrtExport: boolean
  projectId: string
}

export default function ExportCompleteSheet({
  downloadUrl,
  onClose,
  onOpenThumbnailModal,
  hasSrtExport,
  projectId,
}: ExportCompleteSheetProps) {
  const handleDownload = () => {
    window.location.href = downloadUrl
  }

  const handleOpenThumbnail = () => {
    onClose()
    onOpenThumbnailModal()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#2c1e16] shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15">
              <span className="material-symbols-outlined text-xl text-emerald-400">check_circle</span>
            </div>
            <h2 className="text-lg font-bold text-white">書き出し完了!</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* アクション */}
        <div className="space-y-3 p-6">
          {/* 動画ダウンロード */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">動画をダウンロード</p>
              <p className="text-[11px] text-white/50">書き出された動画ファイルを保存</p>
            </div>
          </button>

          {/* サムネイル生成 */}
          <button
            type="button"
            onClick={handleOpenThumbnail}
            className="flex w-full items-center gap-4 rounded-xl border border-primary/30 bg-white/5 p-4 text-left transition-colors hover:bg-white/8"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Image className="h-5 w-5 text-white/70" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">サムネイルを生成</p>
              <p className="text-[11px] text-white/50">AIでYouTubeサムネイルを作成</p>
            </div>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              NEW
            </span>
          </button>

          {/* SRT取得 */}
          {hasSrtExport && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/download/${projectId}?type=srt`
              }}
              className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/8"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <FileText className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">SRTファイルを取得</p>
                <p className="text-[11px] text-white/50">字幕ファイルをダウンロード</p>
              </div>
            </button>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
