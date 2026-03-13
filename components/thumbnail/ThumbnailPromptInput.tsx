'use client'

import { useThumbnailStore } from '@/lib/stores/thumbnail-store'

const colorSchemes = [
  { id: 'warm', label: '暖色' },
  { id: 'cool', label: '寒色' },
  { id: 'vibrant', label: 'ビビッド' },
  { id: 'dark', label: 'ダーク' },
]

const textPositions = [
  { id: 'left', label: '左' },
  { id: 'center', label: '中央' },
  { id: 'right', label: '右' },
] as const

const countOptions = [1, 2, 3, 4]

export default function ThumbnailPromptInput() {
  const { prompt, setPrompt, options, setOptions } = useThumbnailStore()

  return (
    <div className="space-y-4">
      {/* テキスト入力 */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-white/50">
          サムネイルに入れるテキスト
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例: 最強武器で無双してみた"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-primary focus:outline-none"
        />
      </div>

      {/* オプション */}
      <div className="grid grid-cols-3 gap-3">
        {/* 色味 */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium text-white/40">
            色味
          </label>
          <div className="flex flex-wrap gap-1">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setOptions({ colorScheme: scheme.id })}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  options.colorScheme === scheme.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-white/50 hover:text-white/70'
                }`}
              >
                {scheme.label}
              </button>
            ))}
          </div>
        </div>

        {/* テキスト位置 */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium text-white/40">
            テキスト位置
          </label>
          <div className="flex gap-1">
            {textPositions.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setOptions({ textPosition: pos.id })}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  options.textPosition === pos.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-white/50 hover:text-white/70'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* 生成枚数 */}
        <div>
          <label className="mb-1.5 block text-[10px] font-medium text-white/40">
            生成枚数
          </label>
          <div className="flex gap-1">
            {countOptions.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setOptions({ count })}
                className={`flex size-7 items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
                  options.count === count
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-white/50 hover:text-white/70'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
