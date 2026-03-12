import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { CaptionItem } from '../../lib/composition-data'

interface CaptionTrackRendererProps {
  items: CaptionItem[]
  fps: number
}

interface CaptionToken {
  text: string
  fromMs: number
  toMs: number
}

function HighlightedWordCaption({
  item,
  currentMs,
}: {
  item: CaptionItem
  currentMs: number
}) {
  const tokens = item.tokens ?? []
  if (tokens.length === 0) {
    return <span>{item.text}</span>
  }

  return (
    <>
      {tokens.map((token, i) => {
        const isActive = currentMs >= token.fromMs && currentMs <= token.toMs
        return (
          <span
            key={i}
            style={{
              color: isActive ? '#FFD700' : '#FFFFFF',
              fontWeight: isActive ? 900 : 700,
              transition: 'color 0.05s, font-weight 0.05s',
            }}
          >
            {token.text}
          </span>
        )
      })}
    </>
  )
}

function KaraokeCaption({
  item,
  currentMs,
}: {
  item: CaptionItem
  currentMs: number
}) {
  const tokens = item.tokens ?? []
  if (tokens.length === 0) {
    return <span>{item.text}</span>
  }

  const totalDuration = item.endMs - item.startMs
  const elapsed = currentMs - item.startMs
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration))

  return (
    <span
      style={{
        background: `linear-gradient(90deg, #FFD700 ${progress * 100}%, #FFFFFF ${progress * 100}%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {item.text}
    </span>
  )
}

function BounceCaption({
  item,
  currentMs,
  fps,
  frame,
}: {
  item: CaptionItem
  currentMs: number
  fps: number
  frame: number
}) {
  const tokens = item.tokens ?? []
  if (tokens.length === 0) {
    return <span>{item.text}</span>
  }

  return (
    <>
      {tokens.map((token, i) => {
        const isActive = currentMs >= token.fromMs && currentMs <= token.toMs
        const tokenStartFrame = Math.round((token.fromMs / 1000) * fps)
        const bounceScale = isActive
          ? spring({
              frame: frame - tokenStartFrame,
              fps,
              config: { damping: 12, stiffness: 200, mass: 0.5 },
            })
          : 1

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `scale(${bounceScale})`,
              color: isActive ? '#FFD700' : '#FFFFFF',
              fontWeight: isActive ? 900 : 700,
            }}
          >
            {token.text}
          </span>
        )
      })}
    </>
  )
}

function CaptionItemRenderer({
  item,
  fps,
}: {
  item: CaptionItem
  fps: number
}) {
  const frame = useCurrentFrame()
  const currentMs = (frame / fps) * 1000

  const isVisible = currentMs >= item.startMs && currentMs <= item.endMs
  if (!isVisible) return null

  const startFrame = Math.round((item.startMs / 1000) * fps)
  const endFrame = Math.round((item.endMs / 1000) * fps)

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 4, Math.max(startFrame + 4, endFrame - 4), endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  let content: React.ReactNode
  switch (item.displayStyle) {
    case 'karaoke':
      content = <KaraokeCaption item={item} currentMs={currentMs} />
      break
    case 'bounce':
      content = <BounceCaption item={item} currentMs={currentMs} fps={fps} frame={frame} />
      break
    case 'highlighted-word':
    default:
      content = <HighlightedWordCaption item={item} currentMs={currentMs} />
      break
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 140,
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '14px 28px',
          borderRadius: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          fontSize: 56,
          fontFamily: 'Noto Sans JP, sans-serif',
          fontWeight: 700,
          lineHeight: 1.4,
          textAlign: 'center',
          opacity,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  )
}

export const CaptionTrackRenderer: React.FC<CaptionTrackRendererProps> = ({ items, fps }) => {
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <CaptionItemRenderer key={item.id} item={item} fps={fps} />
      ))}
    </>
  )
}
