import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { SubtitleItem } from '../../lib/composition-data'
import type { PlaybackSegment } from '../../lib/editor'
import { mapTimelineTimeToSourceTime, mapSourceTimeToTimelineTime } from '../../lib/editor'

interface SubtitleTrackRendererProps {
  items: SubtitleItem[]
  fps: number
  playbackSegments?: PlaybackSegment[]
}

function getPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top':
      return { justifyContent: 'flex-start', paddingTop: 96 }
    case 'center':
      return { justifyContent: 'center' }
    case 'bottom':
    default:
      return { justifyContent: 'flex-end', paddingBottom: 108 }
  }
}

function TypewriterText({ text, progress }: { text: string; progress: number }) {
  const charCount = Math.floor(text.length * progress)
  return <>{text.slice(0, charCount)}</>
}

function WordHighlightText({
  text,
  progress,
  highlightColor,
}: {
  text: string
  progress: number
  highlightColor: string
}) {
  const words = text.split(/\s+/)
  const currentWordIndex = Math.floor(progress * words.length)

  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            backgroundColor: i === currentWordIndex ? highlightColor : 'transparent',
            borderRadius: 4,
            padding: '0 4px',
            transition: 'background-color 0.1s',
          }}
        >
          {word}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function SubtitleItemRenderer({
  item,
  fps,
  playbackSegments,
}: {
  item: SubtitleItem
  fps: number
  playbackSegments?: PlaybackSegment[]
}) {
  const frame = useCurrentFrame()
  const timelineSeconds = frame / fps

  // Map timeline time to source time for subtitle matching
  const sourceSeconds = playbackSegments
    ? mapTimelineTimeToSourceTime(timelineSeconds, playbackSegments)
    : timelineSeconds

  const isVisible = sourceSeconds >= item.startTime && sourceSeconds <= item.endTime
  if (!isVisible) return null

  const startFrame = playbackSegments
    ? Math.round(mapSourceTimeToTimelineTime(item.startTime, playbackSegments) * fps)
    : Math.round(item.startTime * fps)
  const endFrame = playbackSegments
    ? Math.round(mapSourceTimeToTimelineTime(item.endTime, playbackSegments) * fps)
    : Math.round(item.endTime * fps)

  const localFrame = frame - startFrame
  const durationFrames = Math.max(1, endFrame - startFrame)
  const progress = Math.min(1, Math.max(0, localFrame / durationFrames))

  // Animation calculations
  let opacity = 1
  let scale = 1

  switch (item.animation) {
    case 'fade':
      opacity = interpolate(
        frame,
        [startFrame, startFrame + 6, Math.max(startFrame + 6, endFrame - 6), endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
      break
    case 'spring':
      scale = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 180, mass: 0.7 },
      })
      opacity = interpolate(
        frame,
        [Math.max(startFrame, endFrame - 6), endFrame],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
      break
    case 'typewriter':
      opacity = interpolate(
        frame,
        [Math.max(startFrame, endFrame - 6), endFrame],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
      break
    case 'word-highlight':
      opacity = interpolate(
        frame,
        [startFrame, startFrame + 4, Math.max(startFrame + 4, endFrame - 4), endFrame],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
      break
    case 'none':
    default:
      break
  }

  const positionStyle = getPositionStyle(item.position)

  // Stroke and shadow styles
  const textStrokeStyle: React.CSSProperties =
    item.strokeColor && item.strokeWidth
      ? {
          WebkitTextStroke: `${item.strokeWidth}px ${item.strokeColor}`,
        }
      : {}

  const textShadowStyle: React.CSSProperties =
    item.shadowColor && item.shadowBlur != null
      ? {
          textShadow: `0 2px ${item.shadowBlur}px ${item.shadowColor}`,
        }
      : { textShadow: '0 2px 18px rgba(0,0,0,0.45)' }

  // Render text content based on animation type
  let textContent: React.ReactNode = item.text
  if (item.animation === 'typewriter') {
    textContent = <TypewriterText text={item.text} progress={progress} />
  } else if (item.animation === 'word-highlight') {
    textContent = (
      <WordHighlightText
        text={item.text}
        progress={progress}
        highlightColor="rgba(255, 215, 0, 0.4)"
      />
    )
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        ...positionStyle,
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '16px 24px',
          borderRadius: 24,
          backgroundColor: item.backgroundColor ?? 'rgba(0, 0, 0, 0.65)',
          color: item.fontColor,
          fontFamily: item.fontFamily,
          fontSize: item.fontSize * 2.2,
          fontWeight: item.isBold ? 800 : 700,
          fontStyle: item.isItalic ? 'italic' : 'normal',
          lineHeight: 1.3,
          textAlign: 'center',
          opacity,
          transform: `scale(${scale})`,
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          ...textStrokeStyle,
          ...textShadowStyle,
        }}
      >
        {textContent}
      </div>
    </AbsoluteFill>
  )
}

export const SubtitleTrackRenderer: React.FC<SubtitleTrackRendererProps> = ({
  items,
  fps,
  playbackSegments,
}) => {
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <SubtitleItemRenderer
          key={item.id}
          item={item}
          fps={fps}
          playbackSegments={playbackSegments}
        />
      ))}
    </>
  )
}
