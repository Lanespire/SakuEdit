'use client'

import { useCallback, useRef } from 'react'
import { Link, Upload, X, ImagePlus } from 'lucide-react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'

export default function ThumbnailReferenceInput() {
  const {
    referenceUrl,
    setReferenceUrl,
    referenceImages,
    addReferenceImage,
    removeReferenceImage,
    clearReferenceImages,
  } = useThumbnailStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          if (base64) addReferenceImage(base64)
        }
        reader.readAsDataURL(file)
      })
    },
    [addReferenceImage]
  )

  return (
    <div className="space-y-4">
      {/* YouTube URL 入力 */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/50">
          <Link className="h-3.5 w-3.5" />
          参考YouTubeチャンネル / 動画URL
        </label>
        <input
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://www.youtube.com/..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-[10px] text-white/30">
          既存のスタイル分析結果がある場合、自動的に利用されます
        </p>
      </div>

      {/* 参考サムネイル画像アップロード */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/50">
          <Upload className="h-3.5 w-3.5" />
          参考サムネイル画像
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/3 p-4 transition-colors hover:border-white/25 hover:bg-white/5"
        >
          <ImagePlus className="h-5 w-5 text-white/30" />
          <div>
            <p className="text-xs text-white/50">参考にしたいサムネイル画像を追加</p>
            <p className="text-[10px] text-white/30">構図・色味・テキスト配置を分析して再現します</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* 参考画像プレビュー */}
      {referenceImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50">
              参考画像 ({referenceImages.length}/5)
            </span>
            <button
              type="button"
              onClick={clearReferenceImages}
              className="text-[10px] text-white/40 hover:text-white/60"
            >
              すべて削除
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {referenceImages.map((base64, index) => (
              <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border border-white/10">
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`参考 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeReferenceImage(index)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
