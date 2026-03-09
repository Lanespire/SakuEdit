import {
  AbsoluteFill,
  Video,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion'

interface VideoCompositionProps {
  videoUrl?: string
  subtitles?: Array<{
    text: string
    startFrame: number
    endFrame: number
    style?: string
  }>
  style?: {
    fontFamily?: string
    fontSize?: number
    color?: string
    outlineColor?: string
  }
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  videoUrl,
  subtitles = [],
  style = {
    fontFamily: 'Noto Sans JP',
    fontSize: 80,
    color: '#ffffff',
    outlineColor: '#000000',
  },
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 現在の字幕を取得
  const currentSubtitle = subtitles.find(
    (sub) => frame >= sub.startFrame && frame <= sub.endFrame
  )

  // アニメーション
  const subtitleOpacity = currentSubtitle
    ? interpolate(
        frame,
        [currentSubtitle.startFrame, currentSubtitle.startFrame + 10, currentSubtitle.endFrame - 10, currentSubtitle.endFrame],
        [0, 1, 1, 0]
      )
    : 0

  const subtitleScale = currentSubtitle
    ? spring({
        frame: frame - currentSubtitle.startFrame,
        fps,
        config: {
          damping: 100,
          stiffness: 200,
          mass: 0.5,
        },
      })
    : 1

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Video Layer */}
      {videoUrl && (
        <AbsoluteFill>
          <Video src={videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}

      {/* Subtitle Layer */}
      {currentSubtitle && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 100,
          }}
        >
          <div
            style={{
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              color: style.color,
              textShadow: `-2px -2px 0 ${style.outlineColor}, 2px -2px 0 ${style.outlineColor}, -2px 2px 0 ${style.outlineColor}, 2px 2px 0 ${style.outlineColor}`,
              opacity: subtitleOpacity,
              transform: `scale(${subtitleScale})`,
            }}
          >
            {currentSubtitle.text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
