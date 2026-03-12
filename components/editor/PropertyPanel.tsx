'use client'

import { useCallback } from 'react'
import type { TrackName } from '@/lib/composition-data'
import { Settings, Type, Volume2, Sparkles, Layers, Music } from 'lucide-react'

export interface PropertyPanelProps {
  selectedItem: Record<string, unknown> | null
  selectedTrack: TrackName | null
  onUpdateItem: (track: TrackName, itemId: string, fields: Record<string, unknown>) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-white/60 mb-1">{children}</label>
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>
}

const inputClass =
  'w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none'
const selectClass =
  'w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none'

function SubtitleFields({
  item,
  onChange,
}: {
  item: Record<string, unknown>
  onChange: (fields: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldRow>
        <FieldLabel>テキスト</FieldLabel>
        <textarea
          className={`${inputClass} min-h-[60px] resize-y`}
          value={(item.text as string) ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>位置</FieldLabel>
        <select
          className={selectClass}
          value={(item.position as string) ?? 'bottom'}
          onChange={(e) => onChange({ position: e.target.value })}
        >
          <option value="top">上</option>
          <option value="center">中央</option>
          <option value="bottom">下</option>
        </select>
      </FieldRow>
      <FieldRow>
        <FieldLabel>フォントサイズ: {item.fontSize as number ?? 24}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={12}
          max={72}
          step={1}
          value={(item.fontSize as number) ?? 24}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>文字色</FieldLabel>
        <input
          type="color"
          className="h-8 w-full rounded border border-white/10 bg-transparent"
          value={(item.fontColor as string) ?? '#FFFFFF'}
          onChange={(e) => onChange({ fontColor: e.target.value })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>背景色</FieldLabel>
        <input
          type="color"
          className="h-8 w-full rounded border border-white/10 bg-transparent"
          value={(item.backgroundColor as string) ?? '#000000'}
          onChange={(e) => onChange({ backgroundColor: e.target.value })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>アニメーション</FieldLabel>
        <select
          className={selectClass}
          value={(item.animation as string) ?? 'fade'}
          onChange={(e) => onChange({ animation: e.target.value })}
        >
          <option value="fade">フェード</option>
          <option value="spring">スプリング</option>
          <option value="typewriter">タイプライター</option>
          <option value="word-highlight">ワードハイライト</option>
          <option value="none">なし</option>
        </select>
      </FieldRow>
      <FieldRow>
        <FieldLabel>フォント</FieldLabel>
        <select
          className={selectClass}
          value={(item.fontFamily as string) ?? 'Noto Sans JP, sans-serif'}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
        >
          <option value="Noto Sans JP, sans-serif">Noto Sans JP</option>
          <option value="M PLUS Rounded 1c, sans-serif">M PLUS Rounded 1c</option>
          <option value="Zen Maru Gothic, sans-serif">Zen Maru Gothic</option>
          <option value="Kosugi Maru, sans-serif">Kosugi Maru</option>
        </select>
      </FieldRow>
    </>
  )
}

function AudioFields({
  item,
  onChange,
}: {
  item: Record<string, unknown>
  onChange: (fields: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldRow>
        <FieldLabel>音量: {((item.volume as number) ?? 1).toFixed(2)}</FieldLabel>
        <input
          type="range"
          className="w-full accent-green-400"
          min={0}
          max={2}
          step={0.05}
          value={(item.volume as number) ?? 1}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>フェードイン(秒): {((item.fadeInSeconds as number) ?? 0).toFixed(1)}</FieldLabel>
        <input
          type="range"
          className="w-full accent-green-400"
          min={0}
          max={5}
          step={0.1}
          value={(item.fadeInSeconds as number) ?? 0}
          onChange={(e) => onChange({ fadeInSeconds: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>フェードアウト(秒): {((item.fadeOutSeconds as number) ?? 0).toFixed(1)}</FieldLabel>
        <input
          type="range"
          className="w-full accent-green-400"
          min={0}
          max={5}
          step={0.1}
          value={(item.fadeOutSeconds as number) ?? 0}
          onChange={(e) => onChange({ fadeOutSeconds: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>ループ</FieldLabel>
        <input
          type="checkbox"
          className="accent-green-400"
          checked={(item.loop as boolean) ?? false}
          onChange={(e) => onChange({ loop: e.target.checked })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>カテゴリ</FieldLabel>
        <select
          className={selectClass}
          value={(item.category as string) ?? 'se'}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="bgm">BGM</option>
          <option value="se">SE</option>
          <option value="voiceover">ナレーション</option>
          <option value="sfx-builtin">ビルトインSFX</option>
        </select>
      </FieldRow>
    </>
  )
}

function EffectFields({ item }: { item: Record<string, unknown> }) {
  const config = (item.config as Record<string, unknown>) ?? {}
  return (
    <>
      <FieldRow>
        <FieldLabel>エフェクトタイプ</FieldLabel>
        <div className={`${inputClass} bg-white/3 cursor-not-allowed`}>{(item.effectType as string) ?? '-'}</div>
      </FieldRow>
      {Object.entries(config).map(([key, value]) => (
        <FieldRow key={key}>
          <FieldLabel>{key}</FieldLabel>
          <div className={`${inputClass} bg-white/3`}>{String(value)}</div>
        </FieldRow>
      ))}
    </>
  )
}

function OverlayFields({
  item,
  onChange,
}: {
  item: Record<string, unknown>
  onChange: (fields: Record<string, unknown>) => void
}) {
  const position = (item.position as { x: number; y: number }) ?? { x: 50, y: 50 }
  const size = (item.size as { width: number; height: number }) ?? { width: 200, height: 200 }

  return (
    <>
      <FieldRow>
        <FieldLabel>オーバーレイタイプ</FieldLabel>
        <div className={`${inputClass} bg-white/3 cursor-not-allowed`}>{(item.overlayType as string) ?? '-'}</div>
      </FieldRow>
      <FieldRow>
        <FieldLabel>X位置: {position.x}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={0}
          max={1920}
          step={1}
          value={position.x}
          onChange={(e) => onChange({ position: { ...position, x: Number(e.target.value) } })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Y位置: {position.y}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={0}
          max={1080}
          step={1}
          value={position.y}
          onChange={(e) => onChange({ position: { ...position, y: Number(e.target.value) } })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>幅: {size.width}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={10}
          max={1920}
          step={1}
          value={size.width}
          onChange={(e) => onChange({ size: { ...size, width: Number(e.target.value) } })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>高さ: {size.height}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={10}
          max={1080}
          step={1}
          value={size.height}
          onChange={(e) => onChange({ size: { ...size, height: Number(e.target.value) } })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>回転: {(item.rotation as number) ?? 0}°</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={0}
          max={360}
          step={1}
          value={(item.rotation as number) ?? 0}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>不透明度: {((item.opacity as number) ?? 1).toFixed(2)}</FieldLabel>
        <input
          type="range"
          className="w-full accent-orange-400"
          min={0}
          max={1}
          step={0.01}
          value={(item.opacity as number) ?? 1}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </FieldRow>
    </>
  )
}

const trackIcons: Record<string, React.ReactNode> = {
  subtitleTrack: <Type className="h-4 w-4" />,
  audioTracks: <Volume2 className="h-4 w-4" />,
  effectTrack: <Sparkles className="h-4 w-4" />,
  overlayTrack: <Layers className="h-4 w-4" />,
  captionTrack: <Type className="h-4 w-4" />,
  videoTrack: <Music className="h-4 w-4" />,
}

const trackLabels: Record<string, string> = {
  videoTrack: '動画',
  audioTracks: 'オーディオ',
  subtitleTrack: '字幕',
  effectTrack: 'エフェクト',
  overlayTrack: 'オーバーレイ',
  captionTrack: 'キャプション',
}

export default function PropertyPanel({ selectedItem, selectedTrack, onUpdateItem }: PropertyPanelProps) {
  const handleChange = useCallback(
    (fields: Record<string, unknown>) => {
      if (selectedTrack && selectedItem?.id) {
        onUpdateItem(selectedTrack, selectedItem.id as string, fields)
      }
    },
    [selectedTrack, selectedItem, onUpdateItem],
  )

  if (!selectedItem || !selectedTrack) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-sm text-white/40">
        <Settings className="mb-2 h-8 w-8 text-white/20" />
        <p>アイテムを選択してプロパティを編集</p>
      </div>
    )
  }

  const startTime = (selectedItem.startTime as number) ?? 0
  const endTime = (selectedItem.endTime as number) ?? 0

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#1a1411]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        {trackIcons[selectedTrack]}
        <span className="text-sm font-bold text-white/80">{trackLabels[selectedTrack]}</span>
      </div>

      <div className="flex-1 p-4">
        {/* Common timing fields */}
        <FieldRow>
          <FieldLabel>開始時間(秒)</FieldLabel>
          <input
            type="number"
            className={inputClass}
            step={0.1}
            min={0}
            value={startTime}
            onChange={(e) => handleChange({ startTime: Number(e.target.value) })}
          />
        </FieldRow>
        <FieldRow>
          <FieldLabel>終了時間(秒)</FieldLabel>
          <input
            type="number"
            className={inputClass}
            step={0.1}
            min={startTime}
            value={endTime}
            onChange={(e) => handleChange({ endTime: Number(e.target.value) })}
          />
        </FieldRow>

        <div className="my-3 border-t border-white/10" />

        {/* Track-specific fields */}
        {selectedTrack === 'subtitleTrack' && (
          <SubtitleFields item={selectedItem} onChange={handleChange} />
        )}
        {selectedTrack === 'audioTracks' && (
          <AudioFields item={selectedItem} onChange={handleChange} />
        )}
        {selectedTrack === 'effectTrack' && <EffectFields item={selectedItem} />}
        {selectedTrack === 'overlayTrack' && (
          <OverlayFields item={selectedItem} onChange={handleChange} />
        )}
        {selectedTrack === 'captionTrack' && (
          <>
            <FieldRow>
              <FieldLabel>テキスト</FieldLabel>
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                value={(selectedItem.text as string) ?? ''}
                onChange={(e) => handleChange({ text: e.target.value })}
              />
            </FieldRow>
            <FieldRow>
              <FieldLabel>表示スタイル</FieldLabel>
              <select
                className={selectClass}
                value={(selectedItem.displayStyle as string) ?? 'highlighted-word'}
                onChange={(e) => handleChange({ displayStyle: e.target.value })}
              >
                <option value="highlighted-word">ハイライト</option>
                <option value="karaoke">カラオケ</option>
                <option value="bounce">バウンス</option>
              </select>
            </FieldRow>
          </>
        )}
      </div>
    </div>
  )
}
