import { AbsoluteFill, useVideoConfig } from 'remotion'
import type { CompositionData } from '../../lib/composition-data'
import {
  VideoTrackRenderer,
  AudioTrackRenderer,
  SubtitleTrackRenderer,
  CaptionTrackRenderer,
  EffectTrackRenderer,
  OverlayTrackRenderer,
} from '../renderers'

export interface UniversalCompositionProps {
  compositionData: CompositionData
}

export const UniversalComposition: React.FC<UniversalCompositionProps> = ({
  compositionData,
}) => {
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: compositionData.meta.backgroundColor }}>
      <VideoTrackRenderer items={compositionData.videoTrack} fps={fps} />
      <AudioTrackRenderer items={compositionData.audioTracks} fps={fps} />
      <EffectTrackRenderer items={compositionData.effectTrack} fps={fps} />
      <OverlayTrackRenderer items={compositionData.overlayTrack} fps={fps} />
      <SubtitleTrackRenderer
        items={compositionData.subtitleTrack}
        fps={fps}
        playbackSegments={compositionData.videoTrack[0]?.playbackSegments}
      />
      {compositionData.captionTrack.length > 0 && (
        <CaptionTrackRenderer items={compositionData.captionTrack} fps={fps} />
      )}
    </AbsoluteFill>
  )
}
