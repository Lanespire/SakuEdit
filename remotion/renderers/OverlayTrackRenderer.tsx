import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { Rect, Circle, Triangle, Star, Ellipse, Pie, Arrow, Heart, Polygon } from '@remotion/shapes'
import { Lottie } from '@remotion/lottie'
import { Gif } from '@remotion/gif'
import type { OverlayItem, ShapeType } from '../../lib/composition-data'

interface OverlayTrackRendererProps {
  items: OverlayItem[]
  fps: number
}

// --- Shape rendering ---
function ShapeOverlay({
  shapeType,
  width,
  height,
  config,
}: {
  shapeType: ShapeType
  width: number
  height: number
  config: Record<string, unknown>
}) {
  const fill = (config.fill as string) ?? '#ffffff'
  const stroke = (config.stroke as string) ?? 'transparent'
  const strokeWidth = (config.strokeWidth as number) ?? 0

  const commonProps = { fill, stroke, strokeWidth }

  switch (shapeType) {
    case 'rect':
      return <Rect width={width} height={height} {...commonProps} />
    case 'circle':
      return <Circle radius={Math.min(width, height) / 2} {...commonProps} />
    case 'triangle':
      return <Triangle length={Math.min(width, height)} direction="up" {...commonProps} />
    case 'star':
      return (
        <Star
          innerRadius={Math.min(width, height) / 4}
          outerRadius={Math.min(width, height) / 2}
          points={(config.points as number) ?? 5}
          {...commonProps}
        />
      )
    case 'ellipse':
      return <Ellipse rx={width / 2} ry={height / 2} {...commonProps} />
    case 'pie':
      return (
        <Pie
          radius={Math.min(width, height) / 2}
          progress={(config.progress as number) ?? 0.75}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    case 'arrow':
      return (
        <Arrow
          length={width}
          direction="right"
          {...commonProps}
        />
      )
    case 'heart':
      return <Heart height={height} {...commonProps} />
    case 'polygon':
      return (
        <Polygon
          radius={Math.min(width, height) / 2}
          points={(config.points as number) ?? 6}
          {...commonProps}
        />
      )
    default:
      return null
  }
}

// --- Lottie overlay ---
function LottieOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const animationData = config.animationData as
    | { fr: number; w: number; h: number; op: number; [key: string]: unknown }
    | undefined
  if (!animationData) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: '#aaa',
          fontSize: 14,
        }}
      >
        Lottie
      </div>
    )
  }

  return <Lottie animationData={animationData} style={{ width, height }} />
}

// --- Gif overlay ---
function GifOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const src = config.src as string | undefined
  if (!src) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: '#aaa',
          fontSize: 14,
        }}
      >
        GIF
      </div>
    )
  }

  return <Gif src={src} width={width} height={height} />
}

// --- Text overlay ---
function TextOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: (config.color as string) ?? '#ffffff',
        fontSize: (config.fontSize as number) ?? 32,
        fontFamily: (config.fontFamily as string) ?? 'Noto Sans JP, sans-serif',
        fontWeight: (config.fontWeight as number) ?? 700,
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {(config.text as string) ?? ''}
    </div>
  )
}

// --- Image overlay ---
function ImageOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const src = config.src as string | undefined
  if (!src) return null

  return (
    <Img
      src={src}
      style={{
        width,
        height,
        objectFit: (config.objectFit as React.CSSProperties['objectFit']) ?? 'contain',
        borderRadius: (config.borderRadius as number) ?? 0,
      }}
    />
  )
}

// --- Placeholder for unsupported types ---
function PlaceholderOverlay({
  overlayType,
  width,
  height,
}: {
  overlayType: string
  width: number
  height: number
}) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px dashed rgba(255,255,255,0.2)',
        borderRadius: 8,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontFamily: 'sans-serif',
      }}
    >
      {overlayType}
    </div>
  )
}

// --- Animation helpers ---
function getAnimationStyles(
  animation: OverlayItem['animation'],
  frame: number,
  startFrame: number,
  fps: number,
): React.CSSProperties {
  const localFrame = frame - startFrame
  const durFrames = animation.durationFrames ?? 15

  switch (animation.type) {
    case 'fade-in': {
      const opacity = interpolate(localFrame, [0, durFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
      return { opacity }
    }
    case 'slide-in': {
      const x = interpolate(localFrame, [0, durFrames], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
      return { transform: `translateX(${x}%)` }
    }
    case 'scale-in': {
      const s = interpolate(localFrame, [0, durFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
      return { transform: `scale(${s})` }
    }
    case 'spring': {
      const s = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 160, mass: 0.8 },
      })
      return { transform: `scale(${s})` }
    }
    case 'none':
    default:
      return {}
  }
}

// --- Single overlay item ---
function OverlayItemRenderer({ item, fps }: { item: OverlayItem; fps: number }) {
  const frame = useCurrentFrame()
  const startFrame = Math.round(item.startTime * fps)

  const animStyle = getAnimationStyles(item.animation, frame, startFrame, fps)
  const { width, height } = item.size

  let content: React.ReactNode
  switch (item.overlayType) {
    case 'text':
      content = <TextOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'image':
      content = <ImageOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'shape': {
      const shapeType = (item.overlayConfig.shapeType as ShapeType) ?? 'rect'
      content = (
        <ShapeOverlay
          shapeType={shapeType}
          width={width}
          height={height}
          config={item.overlayConfig}
        />
      )
      break
    }
    case 'lottie':
      content = <LottieOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'gif':
      content = <GifOverlay config={item.overlayConfig} width={width} height={height} />
      break
    default:
      content = <PlaceholderOverlay overlayType={item.overlayType} width={width} height={height} />
      break
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: item.position.x,
        top: item.position.y,
        width,
        height,
        transform: `rotate(${item.rotation}deg)`,
        opacity: item.opacity,
        zIndex: item.layer,
        ...animStyle,
      }}
    >
      {content}
    </div>
  )
}

export const OverlayTrackRenderer: React.FC<OverlayTrackRendererProps> = ({ items, fps }) => {
  if (items.length === 0) return null

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {items.map((item) => {
        const startFrame = Math.round(item.startTime * fps)
        const durationInFrames = Math.max(1, Math.round((item.endTime - item.startTime) * fps))

        return (
          <Sequence key={item.id} from={startFrame} durationInFrames={durationInFrames}>
            <OverlayItemRenderer item={item} fps={fps} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
