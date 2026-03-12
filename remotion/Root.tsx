import { Composition } from 'remotion'
import { EDITOR_FPS, getDurationInFrames, getPlaybackSegments } from '../lib/editor'
import { createEmptyCompositionData, type CompositionData } from '../lib/composition-data'
import { VideoComposition, type VideoCompositionProps } from './compositions/VideoComposition'
import { UniversalComposition, type UniversalCompositionProps } from './compositions/UniversalComposition'

type RemotionCompositionProps = VideoCompositionProps & {
  renderConfig?: {
    width?: number
    height?: number
    fps?: number
  }
}

const DEFAULT_WIDTH = 1920
const DEFAULT_HEIGHT = 1080

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        fps={EDITOR_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          videoUrl: null,
          subtitles: [],
          styleName: undefined,
          playbackSegments: getPlaybackSegments(10, [], false),
          subtitleFontFamily: 'Noto Sans JP, sans-serif',
          showStyleBadge: true,
          renderConfig: {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            fps: EDITOR_FPS,
          },
        } satisfies RemotionCompositionProps}
        durationInFrames={getDurationInFrames(10)}
        calculateMetadata={({ props }) => {
          const typedProps = props as RemotionCompositionProps
          const fps = typedProps.renderConfig?.fps ?? EDITOR_FPS
          const width = typedProps.renderConfig?.width ?? DEFAULT_WIDTH
          const height = typedProps.renderConfig?.height ?? DEFAULT_HEIGHT
          const durationInFrames = Math.max(
            1,
            getDurationInFrames(typedProps.playbackSegments?.at(-1)?.timelineEnd ?? 10, fps),
          )

          return {
            durationInFrames,
            fps,
            width,
            height,
          }
        }}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Composition
        id="UniversalComposition"
        component={UniversalComposition as any}
        fps={EDITOR_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          compositionData: createEmptyCompositionData(10),
        } as any}
        durationInFrames={getDurationInFrames(10)}
        calculateMetadata={({ props }: { props: Record<string, unknown> }) => {
          const data = (props as unknown as UniversalCompositionProps).compositionData
          return {
            fps: data.meta.fps,
            width: data.meta.width,
            height: data.meta.height,
            durationInFrames: Math.max(1, Math.ceil(data.meta.durationSeconds * data.meta.fps)),
          }
        }}
      />
    </>
  )
}
