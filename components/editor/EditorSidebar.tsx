'use client'

import { useState, useCallback } from 'react'
import {
  Type,
  Sparkles,
  Image,
  Music,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Heart,
  Hexagon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { TrackName } from '@/lib/composition-data'
import { generateItemId } from '@/lib/composition-data'

export interface EditorSidebarProps {
  onAddItem: (track: TrackName, item: Record<string, unknown>) => void
  playheadSeconds: number
}

type Category = 'text' | 'effect' | 'media' | 'shape' | 'audio'

const categories: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'text', label: 'テキスト', icon: <Type className="h-5 w-5" /> },
  { key: 'effect', label: 'エフェクト', icon: <Sparkles className="h-5 w-5" /> },
  { key: 'media', label: 'メディア', icon: <Image className="h-5 w-5" /> },
  { key: 'shape', label: '図形', icon: <Square className="h-5 w-5" /> },
  { key: 'audio', label: 'オーディオ', icon: <Music className="h-5 w-5" /> },
]

const effectTypes = [
  { type: 'particle', label: 'パーティクル' },
  { type: 'light-leak', label: 'ライトリーク' },
  { type: 'camera-motion-blur', label: 'モーションブラー' },
  { type: 'transition-fade', label: 'フェード' },
  { type: 'transition-slide', label: 'スライド' },
  { type: 'transition-wipe', label: 'ワイプ' },
  { type: 'noise-gradient', label: 'ノイズグラデーション' },
]

const shapeTypes: { type: string; label: string; icon: React.ReactNode }[] = [
  { type: 'rect', label: '長方形', icon: <Square className="h-5 w-5" /> },
  { type: 'circle', label: '円', icon: <Circle className="h-5 w-5" /> },
  { type: 'triangle', label: '三角形', icon: <Triangle className="h-5 w-5" /> },
  { type: 'star', label: '星', icon: <Star className="h-5 w-5" /> },
  { type: 'ellipse', label: '楕円', icon: <Circle className="h-5 w-5" /> },
  { type: 'pie', label: 'パイ', icon: <Circle className="h-5 w-5" /> },
  { type: 'arrow', label: '矢印', icon: <ArrowRight className="h-5 w-5" /> },
  { type: 'heart', label: 'ハート', icon: <Heart className="h-5 w-5" /> },
  { type: 'polygon', label: '多角形', icon: <Hexagon className="h-5 w-5" /> },
]

const sfxTypes = [
  'whoosh', 'whip', 'pageTurn', 'uiSwitch', 'mouseClick',
  'shutterModern', 'shutterOld', 'ding', 'bruh', 'vineBoom', 'windowsXpError',
]

export default function EditorSidebar({ onAddItem, playheadSeconds }: EditorSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('text')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const addWithTiming = useCallback(
    (track: TrackName, item: Record<string, unknown>) => {
      onAddItem(track, {
        ...item,
        id: item.id ?? generateItemId(),
        startTime: playheadSeconds,
        endTime: playheadSeconds + 3,
      })
    },
    [onAddItem, playheadSeconds],
  )

  return (
    <div className="flex h-full">
      {/* アイコンタブ（常時表示） */}
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-white/10 bg-[#120d0b] py-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            title={cat.label}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-medium transition-colors ${
              activeCategory === cat.key && !isCollapsed
                ? 'bg-orange-400/15 text-orange-300'
                : 'text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
            onClick={() => {
              setActiveCategory(cat.key)
              if (isCollapsed) setIsCollapsed(false)
            }}
          >
            {cat.icon}
            <span className="mt-0.5">{cat.label}</span>
          </button>
        ))}

        {/* 折りたたみトグル */}
        <div className="mt-auto">
          <button
            type="button"
            title={isCollapsed ? 'パネルを開く' : 'パネルを閉じる'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* コンテンツエリア（折りたたみ可能） */}
      {!isCollapsed && (
        <div className="flex w-[220px] flex-col bg-[#1a1411]">
          {/* ヘッダー */}
          <div className="flex h-10 items-center border-b border-white/10 px-3">
            <span className="text-xs font-bold text-white/70">
              {categories.find((c) => c.key === activeCategory)?.label}
            </span>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeCategory === 'text' && (
              <div className="grid grid-cols-1 gap-2">
                <ItemButton
                  label="字幕"
                  onClick={() =>
                    addWithTiming('subtitleTrack', {
                      text: '新しい字幕',
                      position: 'bottom',
                      fontSize: 24,
                      fontColor: '#FFFFFF',
                      fontFamily: 'Noto Sans JP, sans-serif',
                      isBold: false,
                      isItalic: false,
                      animation: 'fade',
                      displayMode: 'sentence',
                    })
                  }
                />
                <ItemButton
                  label="テロップ"
                  onClick={() =>
                    addWithTiming('overlayTrack', {
                      overlayType: 'text',
                      position: { x: 960, y: 540 },
                      size: { width: 400, height: 100 },
                      rotation: 0,
                      opacity: 1,
                      layer: 0,
                      animation: { type: 'none' },
                      overlayConfig: { text: '新しいテロップ', fontSize: 32, color: '#FFFFFF' },
                    })
                  }
                />
                <ItemButton
                  label="キャプション"
                  onClick={() =>
                    onAddItem('captionTrack', {
                      id: generateItemId(),
                      text: '新しいキャプション',
                      startMs: playheadSeconds * 1000,
                      endMs: (playheadSeconds + 3) * 1000,
                      displayStyle: 'highlighted-word',
                    })
                  }
                />
              </div>
            )}

            {activeCategory === 'effect' && (
              <div className="grid grid-cols-1 gap-2">
                {effectTypes.map((eff) => (
                  <ItemButton
                    key={eff.type}
                    label={eff.label}
                    onClick={() =>
                      addWithTiming('effectTrack', {
                        effectType: eff.type,
                        config: {},
                      })
                    }
                  />
                ))}
              </div>
            )}

            {activeCategory === 'media' && (
              <div className="grid grid-cols-1 gap-2">
                <ItemButton
                  label="画像"
                  onClick={() =>
                    addWithTiming('overlayTrack', {
                      overlayType: 'image',
                      position: { x: 960, y: 540 },
                      size: { width: 400, height: 300 },
                      rotation: 0,
                      opacity: 1,
                      layer: 0,
                      animation: { type: 'none' },
                      overlayConfig: { src: '' },
                    })
                  }
                />
                <ItemButton
                  label="GIF"
                  onClick={() =>
                    addWithTiming('overlayTrack', {
                      overlayType: 'gif',
                      position: { x: 960, y: 540 },
                      size: { width: 300, height: 300 },
                      rotation: 0,
                      opacity: 1,
                      layer: 0,
                      animation: { type: 'none' },
                      overlayConfig: { src: '' },
                    })
                  }
                />
              </div>
            )}

            {activeCategory === 'shape' && (
              <div className="grid grid-cols-3 gap-1.5">
                {shapeTypes.map((shape) => (
                  <button
                    key={shape.type}
                    type="button"
                    className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    onClick={() =>
                      addWithTiming('overlayTrack', {
                        overlayType: 'shape',
                        position: { x: 960, y: 540 },
                        size: { width: 200, height: 200 },
                        rotation: 0,
                        opacity: 1,
                        layer: 0,
                        animation: { type: 'none' },
                        overlayConfig: { shapeType: shape.type, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 0 },
                      })
                    }
                  >
                    {shape.icon}
                    <span className="text-[9px]">{shape.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeCategory === 'audio' && (
              <div className="space-y-3">
                <div>
                  <h4 className="mb-2 text-[10px] font-bold text-white/50">オーディオ追加</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <ItemButton
                      label="BGM"
                      onClick={() =>
                        addWithTiming('audioTracks', {
                          category: 'bgm',
                          volume: 0.5,
                          fadeInSeconds: 1,
                          fadeOutSeconds: 1,
                          loop: true,
                          playbackRate: 1,
                          pitch: 0,
                        })
                      }
                    />
                    <ItemButton
                      label="SE"
                      onClick={() =>
                        addWithTiming('audioTracks', {
                          category: 'se',
                          volume: 1,
                          fadeInSeconds: 0,
                          fadeOutSeconds: 0,
                          loop: false,
                          playbackRate: 1,
                          pitch: 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-[10px] font-bold text-white/50">ビルトインSFX</h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {sfxTypes.map((sfx) => (
                      <ItemButton
                        key={sfx}
                        label={sfx}
                        onClick={() =>
                          addWithTiming('audioTracks', {
                            category: 'sfx-builtin',
                            sfxType: sfx,
                            volume: 1,
                            fadeInSeconds: 0,
                            fadeOutSeconds: 0,
                            loop: false,
                            playbackRate: 1,
                            pitch: 0,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
