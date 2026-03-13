import {
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { VideoTrackItem } from '../../lib/composition-data'
import type { PlaybackSegment } from '../../lib/editor'

interface VideoTrackRendererProps {
  items: VideoTrackItem[]
  fps: number
}

const OBJECT_FIT_MAP: Record<string, React.CSSProperties['objectFit']> = {
  cover: 'cover',
  contain: 'contain',
  fill: 'fill',
}

function getVideoVolume(frame: number, totalDurationFrames: number, targetVolume: number) {
  if (totalDurationFrames <= 1) {
    return targetVolume
  }

  if (totalDurationFrames <= 12) {
    return interpolate(frame, [0, totalDurationFrames / 2, totalDurationFrames], [0, targetVolume, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }

  return interpolate(
    frame,
    [0, 6, totalDurationFrames - 6, totalDurationFrames],
    [0, targetVolume, targetVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
}

function VideoItem({ item, fps }: { item: VideoTrackItem; fps: number }) {
  const frame = useCurrentFrame()
  const segments: PlaybackSegment[] =
    item.playbackSegments.length > 0
      ? item.playbackSegments
      : [
          {
            id: 'segment-full',
            sourceStart: item.startTime,
            sourceEnd: item.endTime ?? 10,
            duration: (item.endTime ?? 10) - item.startTime,
            timelineStart: item.startTime,
            timelineEnd: item.endTime ?? 10,
          },
        ]

  const totalDurationFrames = segments.length > 0
    ? Math.max(1, Math.round((segments[segments.length - 1].timelineEnd) * fps))
    : Math.max(1, Math.round(((item.endTime ?? 10) - item.startTime) * fps))

  // Volume with fade support
  const vol = getVideoVolume(frame, totalDurationFrames, item.volume)

  return (
    <AbsoluteFill style={{ opacity: item.opacity }}>
      {segments.map((segment) => {
        const from = Math.round(segment.timelineStart * fps)
        const durationInFrames = Math.max(1, Math.round(segment.duration * fps))

        return (
          <Sequence key={segment.id} from={from} durationInFrames={durationInFrames}>
            <AbsoluteFill>
              <Video
                src={item.sourceUrl}
                startFrom={Math.round(segment.sourceStart * fps)}
                endAt={Math.round(segment.sourceEnd * fps)}
                volume={vol}
                playbackRate={item.playbackRate}
                loop={item.loop}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: OBJECT_FIT_MAP[item.fit] ?? 'cover',
                }}
              />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

export const VideoTrackRenderer: React.FC<VideoTrackRendererProps> = ({ items, fps }) => {
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <VideoItem key={item.id} item={item} fps={fps} />
      ))}
    </>
  )
}
