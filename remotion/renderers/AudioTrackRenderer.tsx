import { Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import * as sfx from '@remotion/sfx'
import type { AudioTrackItem } from '../../lib/composition-data'

interface AudioTrackRendererProps {
  items: AudioTrackItem[]
  fps: number
}

const SFX_MAP: Record<string, string> = {
  whoosh: sfx.whoosh,
  whip: sfx.whip,
  pageTurn: sfx.pageTurn,
  uiSwitch: sfx.uiSwitch,
  mouseClick: sfx.mouseClick,
  shutterModern: sfx.shutterModern,
  shutterOld: sfx.shutterOld,
  ding: sfx.ding,
  bruh: sfx.bruh,
  vineBoom: sfx.vineBoom,
  windowsXpError: sfx.windowsXpError,
}

function AudioItem({ item, fps }: { item: AudioTrackItem; fps: number }) {
  const frame = useCurrentFrame()

  // Determine audio source
  const src =
    item.category === 'sfx-builtin' && item.sfxType
      ? SFX_MAP[item.sfxType]
      : item.sourceUrl

  if (!src) return null

  const startFrame = Math.round(item.startTime * fps)
  const endFrame = item.endTime != null ? Math.round(item.endTime * fps) : undefined
  const durationInFrames = endFrame != null ? Math.max(1, endFrame - startFrame) : undefined

  const fadeInFrames = Math.round(item.fadeInSeconds * fps)
  const fadeOutFrames = Math.round(item.fadeOutSeconds * fps)

  // Volume callback with fade in/out
  const volumeCallback = (f: number) => {
    let vol = item.volume

    // Fade in
    if (fadeInFrames > 0 && f < fadeInFrames) {
      vol *= interpolate(f, [0, fadeInFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    }

    // Fade out
    if (fadeOutFrames > 0 && durationInFrames != null) {
      const fadeOutStart = durationInFrames - fadeOutFrames
      if (f > fadeOutStart) {
        vol *= interpolate(f, [fadeOutStart, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    }

    return Math.max(0, vol)
  }

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <Audio
        src={src}
        volume={volumeCallback}
        playbackRate={item.playbackRate}
        loop={item.loop}
      />
    </Sequence>
  )
}

export const AudioTrackRenderer: React.FC<AudioTrackRendererProps> = ({ items, fps }) => {
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <AudioItem key={item.id} item={item} fps={fps} />
      ))}
    </>
  )
}
