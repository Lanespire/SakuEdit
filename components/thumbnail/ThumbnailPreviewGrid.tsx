'use client'

import { Check, Download, RotateCcw } from 'lucide-react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'

interface ThumbnailPreviewGridProps {
  projectId: string
}

export default function ThumbnailPreviewGrid({ projectId }: ThumbnailPreviewGridProps) {
  const {
    generatedThumbnails,
    selectedThumbnailId,
    selectThumbnail,
    isGenerating,
  } = useThumbnailStore()

  if (generatedThumbnails.length === 0) return null

  const handleSelect = async (thumbnailId: string) => {
    await selectThumbnail(projectId, thumbnailId)
  }

  const handleDownload = (imageUrl: string, thumbnailId: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `thumbnail_${thumbnailId}.png`
    link.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50">
          生成結果
        </h4>
        {selectedThumbnailId && (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <Check className="h-3 w-3" />
            採用済み
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {generatedThumbnails.map((thumbnail) => {
          const isSelected = selectedThumbnailId === thumbnail.id
          return (
            <div
              key={thumbnail.id}
              className={`group relative overflow-hidden rounded-xl border transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* サムネイル画像 */}
              <div className="aspect-video w-full overflow-hidden bg-black">
                <img
                  src={thumbnail.imageUrl}
                  alt="生成サムネイル"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* アクションバー */}
              <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1411] px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => void handleSelect(thumbnail.id)}
                  disabled={isSelected}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${
                    isSelected
                      ? 'bg-primary/20 text-primary'
                      : 'bg-white/5 text-white/60 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  {isSelected ? '採用済み' : '採用'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(thumbnail.imageUrl, thumbnail.id)}
                  className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/50 hover:bg-white/10 hover:text-white/70"
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>

              {/* 選択インジケータ */}
              {isSelected && (
                <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary shadow-lg">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
