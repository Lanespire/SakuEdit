'use client'

import { useEffect, useState } from 'react'
import { useThumbnailStore } from '@/lib/stores/thumbnail-store'
import type { ThumbnailTemplate } from '@/lib/thumbnail-templates'
import { Gamepad2, Camera, GraduationCap, Briefcase, Sparkles } from 'lucide-react'

const categoryConfig: Record<
  ThumbnailTemplate['category'],
  { label: string; icon: React.ReactNode }
> = {
  gaming: { label: 'ゲーム', icon: <Gamepad2 className="h-3.5 w-3.5" /> },
  vlog: { label: 'Vlog', icon: <Camera className="h-3.5 w-3.5" /> },
  education: { label: '教育', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  business: { label: 'ビジネス', icon: <Briefcase className="h-3.5 w-3.5" /> },
  entertainment: { label: 'エンタメ', icon: <Sparkles className="h-3.5 w-3.5" /> },
}

export default function ThumbnailTemplateGrid() {
  const [templates, setTemplates] = useState<ThumbnailTemplate[]>([])
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { selectedTemplateId, setSelectedTemplateId } = useThumbnailStore()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const url = filterCategory
          ? `/api/thumbnail/templates?category=${filterCategory}`
          : '/api/thumbnail/templates'
        const response = await fetch(url)
        if (response.ok) {
          const data = (await response.json()) as { templates: ThumbnailTemplate[] }
          setTemplates(data.templates)
        }
      } catch (error) {
        console.error('テンプレート取得エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchTemplates()
  }, [filterCategory])

  const categories = Object.entries(categoryConfig)

  return (
    <div className="space-y-3">
      {/* カテゴリフィルタ */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterCategory(null)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
            filterCategory === null
              ? 'bg-primary/20 text-primary'
              : 'bg-white/5 text-white/50 hover:text-white/70'
          }`}
        >
          すべて
        </button>
        {categories.map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterCategory(key)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filterCategory === key
                ? 'bg-primary/20 text-primary'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* テンプレートグリッド */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="material-symbols-outlined animate-spin text-2xl text-white/30">sync</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplateId(template.id)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                selectedTemplateId === template.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              }`}
            >
              {/* プレビュー画像プレースホルダー */}
              <div className="mb-2 aspect-video w-full overflow-hidden rounded-lg bg-white/5">
                <div className="flex h-full items-center justify-center">
                  <span className="text-[10px] text-white/30">{template.name}</span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/80">{template.name}</p>
              <p className="mt-0.5 text-[10px] text-white/40">{template.description}</p>
              {/* カテゴリバッジ */}
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">
                {categoryConfig[template.category]?.icon}
                {categoryConfig[template.category]?.label}
              </span>
              {/* 選択インジケータ */}
              {selectedTemplateId === template.id && (
                <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary">
                  <span className="material-symbols-outlined text-[12px] text-white">check</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
