'use client'

interface StylePanelProps {
  style?: {
    name: string
    description?: string
    category: string
  }
  onChangeStyle: () => void
}

export default function StylePanel({ style, onChangeStyle }: StylePanelProps) {
  if (!style) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/50">
        <span className="material-symbols-outlined text-5xl mb-4">palette</span>
        <p className="text-sm mb-4">スタイルが設定されていません</p>
        <button
          onClick={onChangeStyle}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors"
          data-test-id="set-style-button"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          スタイルを選択
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="bg-[#3a2a20] border border-white/5 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">palette</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">{style.name}</h3>
            <span className="inline-block text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded">
              {style.category}
            </span>
            {style.description && (
              <p className="text-white/60 text-sm mt-3">{style.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onChangeStyle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-lg border border-white/10 transition-colors"
          data-test-id="change-style-button"
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          スタイルを変更
        </button>
      </div>
    </div>
  )
}
