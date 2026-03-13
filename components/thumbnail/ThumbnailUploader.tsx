'use client'

import { useCallback, useRef } from 'react'
import { Upload, X, ImagePlus } from 'lucide-react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'

export default function ThumbnailUploader() {
  const { uploadedImages, addUploadedImage, removeUploadedImage, clearUploadedImages } =
    useThumbnailStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // data:image/xxx;base64, の部分を除去
          const base64 = result.split(',')[1]
          if (base64) addUploadedImage(base64)
        }
        reader.readAsDataURL(file)
      })
    },
    [addUploadedImage]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="space-y-3">
      {/* ドロップゾーン */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/3 p-6 transition-colors hover:border-white/25 hover:bg-white/5"
      >
        <Upload className="h-8 w-8 text-white/30" />
        <p className="text-sm text-white/50">
          ドラッグ&ドロップ または クリックして素材を追加
        </p>
        <p className="text-[10px] text-white/30">JPG, PNG, WebP（最大5枚）</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* アップロード済み画像プレビュー */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/50">
              アップロード済み ({uploadedImages.length}/5)
            </span>
            <button
              type="button"
              onClick={clearUploadedImages}
              className="text-[10px] text-white/40 hover:text-white/60"
            >
              すべて削除
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((base64, index) => (
              <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border border-white/10">
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`素材 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeUploadedImage(index)
                  }}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploadedImages.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/15 text-white/30 hover:border-white/25 hover:text-white/50"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
