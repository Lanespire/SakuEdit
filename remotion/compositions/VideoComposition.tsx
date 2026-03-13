import {
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {
  buildDisplaySubtitles,
  DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  mapSourceTimeToTimelineTime,
  mapTimelineTimeToSourceTime,
  type PlaybackSegment,
  type SubtitleDisplaySettings,
} from '../../lib/editor'

interface CompositionSubtitle {
  id: string
  text: string
  startTime?: number
  endTime?: number
  position?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string | null
  isBold?: boolean
}

interface VideoCompositionProps {
  videoUrl?: string | null
  subtitles?: CompositionSubtitle[]
  styleName?: string
  playbackSegments?: PlaybackSegment[]
  subtitleDisplaySettings?: SubtitleDisplaySettings
  subtitleFontFamily?: string
  showStyleBadge?: boolean
}

export type { VideoCompositionProps }

const FALLBACK_SEGMENTS: PlaybackSegment[] = [
  {
    id: 'segment-full',
    sourceStart: 0,
    sourceEnd: 10,
    duration: 10,
    timelineStart: 0,
    timelineEnd: 10,
  },
]

function getSubtitlePosition(position: string | undefined) {
  switch (position) {
    case 'top':
    case 'top-center':
      return {
        justifyContent: 'flex-start',
        paddingTop: 96,
      }
    case 'middle':
    case 'center':
      return {
        justifyContent: 'center',
        paddingTop: 0,
      }
    case 'bottom':
    case 'bottom-center':
    default:
      return {
        justifyContent: 'flex-end',
        paddingBottom: 108,
      }
  }
}

function getSubtitleOpacity(
  frame: number,
  startFrame: number,
  endFrame: number,
) {
  const duration = endFrame - startFrame

  if (duration <= 1) {
    return 1
  }

  if (duration <= 12) {
    return interpolate(frame, [startFrame, startFrame + duration / 2, endFrame], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }

  return interpolate(
    frame,
    [startFrame, startFrame + 6, endFrame - 6, endFrame],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  videoUrl,
  subtitles = [],
  styleName,
  playbackSegments = FALLBACK_SEGMENTS,
  subtitleDisplaySettings = DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  subtitleFontFamily = 'Noto Sans JP, sans-serif',
  showStyleBadge = true,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timelineSeconds = frame / fps
  const sourceSeconds = mapTimelineTimeToSourceTime(timelineSeconds, playbackSegments)
  const displaySubtitles = buildDisplaySubtitles(subtitles, subtitleDisplaySettings)

  const currentSubtitle = displaySubtitles.find((subtitle) => {
    const startTime = subtitle.startTime ?? 0
    const endTime = subtitle.endTime ?? startTime
    return sourceSeconds >= startTime && sourceSeconds <= endTime
  })

  const subtitleStartFrame = currentSubtitle
    ? Math.round(mapSourceTimeToTimelineTime(currentSubtitle.startTime ?? 0, playbackSegments) * fps)
    : 0
  const subtitleEndFrame = currentSubtitle
    ? Math.round(mapSourceTimeToTimelineTime(currentSubtitle.endTime ?? 0, playbackSegments) * fps)
    : 0

  const subtitleOpacity = currentSubtitle
    ? getSubtitleOpacity(frame, subtitleStartFrame, subtitleEndFrame)
    : 0

  const subtitleScale = currentSubtitle
    ? spring({
        frame: frame - subtitleStartFrame,
        fps,
        config: {
          damping: 16,
          stiffness: 180,
          mass: 0.7,
        },
      })
    : 1

  const subtitlePosition = getSubtitlePosition(currentSubtitle?.position)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {videoUrl && playbackSegments.map((segment) => {
        const from = Math.round(segment.timelineStart * fps)
        const durationInFrames = Math.max(1, Math.round(segment.duration * fps))

        return (
          <Sequence key={segment.id} from={from} durationInFrames={durationInFrames}>
            <AbsoluteFill>
              <Video
                src={videoUrl}
                startFrom={Math.round(segment.sourceStart * fps)}
                endAt={Math.round(segment.sourceEnd * fps)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </AbsoluteFill>
          </Sequence>
        )
      })}

      {styleName && showStyleBadge ? (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'rgba(10, 10, 10, 0.55)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: 'sans-serif',
            fontSize: 28,
            fontWeight: 700,
            backdropFilter: 'blur(12px)',
          }}
        >
          {styleName}
        </div>
      ) : null}

      {currentSubtitle ? (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            ...subtitlePosition,
          }}
        >
          <div
            style={{
              maxWidth: '82%',
              padding: '16px 24px',
              borderRadius: 24,
              backgroundColor: currentSubtitle.backgroundColor ?? 'rgba(0, 0, 0, 0.65)',
              color: currentSubtitle.fontColor ?? '#ffffff',
              fontFamily: subtitleFontFamily,
              fontSize: currentSubtitle.fontSize ? currentSubtitle.fontSize * 2.2 : 64,
              fontWeight: currentSubtitle.isBold ? 800 : 700,
              lineHeight: 1.3,
              textAlign: 'center',
              opacity: subtitleOpacity,
              transform: `scale(${subtitleScale})`,
              boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
              textShadow: '0 2px 18px rgba(0,0,0,0.45)',
            }}
          >
            {currentSubtitle.text}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  )
}
