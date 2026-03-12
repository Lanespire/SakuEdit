import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { noise2D } from '@remotion/noise'
import { LightLeak } from '@remotion/light-leaks'
import { CameraMotionBlur, Trail } from '@remotion/motion-blur'
import { evolvePath } from '@remotion/paths'
import type { EffectItem, EffectType } from '../../lib/composition-data'

interface EffectTrackRendererProps {
  items: EffectItem[]
  fps: number
}

// --- Particle Effect ---
function ParticleEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const count = (config.count as number) ?? 30
  const color = (config.color as string) ?? 'rgba(255,255,255,0.6)'
  const size = (config.size as number) ?? 4
  const seed = (config.seed as string) ?? 'particle'

  const particles = Array.from({ length: count }, (_, i) => {
    const x = ((noise2D(`${seed}-x`, i * 0.1, frame * 0.01) + 1) / 2) * width
    const y = ((noise2D(`${seed}-y`, i * 0.1, frame * 0.01) + 1) / 2) * height
    const s = size * (0.5 + ((noise2D(`${seed}-s`, i * 0.3, frame * 0.005) + 1) / 2))
    return { x, y, s, key: i }
  })

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={width} height={height}>
        {particles.map((p) => (
          <circle key={p.key} cx={p.x} cy={p.y} r={p.s} fill={color} />
        ))}
      </svg>
    </AbsoluteFill>
  )
}

// --- Light Leak ---
function LightLeakEffect({ config }: { config: Record<string, unknown> }) {
  const seed = (config.seed as number) ?? 0
  const hueShift = (config.hueShift as number) ?? 0

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}>
      <LightLeak seed={seed} hueShift={hueShift} />
    </AbsoluteFill>
  )
}

// --- Camera Motion Blur (wraps children = placeholder) ---
function CameraMotionBlurEffect({ config }: { config: Record<string, unknown> }) {
  const shutterAngle = (config.shutterAngle as number) ?? 180
  const samples = (config.samples as number) ?? 10

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
        <AbsoluteFill style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
      </CameraMotionBlur>
    </AbsoluteFill>
  )
}

// --- Trail ---
function TrailEffect({ config }: { config: Record<string, unknown> }) {
  const lagInFrames = (config.lagInFrames as number) ?? 3
  const trailOpacity = (config.trailOpacity as number) ?? 0.6
  const layers = (config.layers as number) ?? 5

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Trail lagInFrames={lagInFrames} trailOpacity={trailOpacity} layers={layers}>
        <AbsoluteFill style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
      </Trail>
    </AbsoluteFill>
  )
}

// --- Noise Gradient ---
function NoiseGradientEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const seed = (config.seed as string) ?? 'gradient'
  const colors = (config.colors as string[]) ?? ['#ff6b6b', '#4ecdc4', '#45b7d1']
  const scale = (config.scale as number) ?? 0.005

  const canvasWidth = 64
  const canvasHeight = 36
  const pixels: React.ReactNode[] = []

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const noiseVal = (noise2D(seed, x * scale + frame * 0.02, y * scale + frame * 0.01) + 1) / 2
      const colorIndex = Math.floor(noiseVal * (colors.length - 1))
      const color = colors[Math.min(colorIndex, colors.length - 1)]
      pixels.push(
        <rect
          key={`${x}-${y}`}
          x={(x / canvasWidth) * width}
          y={(y / canvasHeight) * height}
          width={width / canvasWidth + 1}
          height={height / canvasHeight + 1}
          fill={color}
          opacity={0.5}
        />,
      )
    }
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay' }}>
      <svg width={width} height={height}>
        {pixels}
      </svg>
    </AbsoluteFill>
  )
}

// --- Audio Visualizer (placeholder) ---
function AudioVisualizerEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const barCount = (config.barCount as number) ?? 32
  const color = (config.color as string) ?? '#4ecdc4'
  const barWidth = width / barCount

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'flex-end' }}>
      <svg width={width} height={height * 0.3} style={{ position: 'absolute', bottom: 0 }}>
        {Array.from({ length: barCount }, (_, i) => {
          const h = ((noise2D('viz', i * 0.5, frame * 0.05) + 1) / 2) * height * 0.25
          return (
            <rect
              key={i}
              x={i * barWidth}
              y={height * 0.3 - h}
              width={barWidth - 2}
              height={h}
              fill={color}
              opacity={0.8}
            />
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}

// --- Path Animation ---
function PathAnimationEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { durationInFrames, width, height } = useVideoConfig()
  const path =
    (config.path as string) ??
    `M 10 80 Q ${width / 2} 10, ${width - 10} 80 T ${width - 10} ${height - 10}`
  const strokeColor = (config.strokeColor as string) ?? '#ffffff'
  const strokeWidth = (config.strokeWidth as number) ?? 3

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const evolved = evolvePath(progress, path)

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={width} height={height}>
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={evolved.strokeDasharray}
          strokeDashoffset={evolved.strokeDashoffset}
        />
      </svg>
    </AbsoluteFill>
  )
}

// --- Transition placeholder ---
function TransitionEffect({
  effectType,
  config,
}: {
  effectType: string
  config: Record<string, unknown>
}) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  let style: React.CSSProperties = {}

  switch (effectType) {
    case 'transition-fade':
      style = { opacity: progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2 }
      break
    case 'transition-slide':
      style = { transform: `translateX(${(1 - progress) * 100}%)` }
      break
    case 'transition-wipe':
      style = {
        clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
      }
      break
    case 'transition-flip':
      style = {
        transform: `rotateY(${progress * 180}deg)`,
        perspective: 1000,
      }
      break
    case 'transition-clock-wipe': {
      const deg = progress * 360
      style = {
        clipPath: `polygon(50% 50%, 50% 0%, ${deg > 90 ? '100% 0%,' : ''} ${deg > 180 ? '100% 100%,' : ''} ${deg > 270 ? '0% 100%,' : ''} ${50 + 50 * Math.sin((deg * Math.PI) / 180)}% ${50 - 50 * Math.cos((deg * Math.PI) / 180)}%)`,
      }
      break
    }
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', ...style }}>
      <AbsoluteFill
        style={{ backgroundColor: (config.color as string) ?? 'rgba(0,0,0,0.8)' }}
      />
    </AbsoluteFill>
  )
}

// --- Main renderer for a single effect ---
function EffectItemRenderer({ item, fps }: { item: EffectItem; fps: number }) {
  switch (item.effectType) {
    case 'particle':
      return <ParticleEffect config={item.config} />
    case 'light-leak':
      return <LightLeakEffect config={item.config} />
    case 'camera-motion-blur':
      return <CameraMotionBlurEffect config={item.config} />
    case 'trail':
      return <TrailEffect config={item.config} />
    case 'noise-gradient':
      return <NoiseGradientEffect config={item.config} />
    case 'audio-visualizer':
      return <AudioVisualizerEffect config={item.config} />
    case 'path-animation':
      return <PathAnimationEffect config={item.config} />
    case 'transition-fade':
    case 'transition-slide':
    case 'transition-wipe':
    case 'transition-flip':
    case 'transition-clock-wipe':
      return <TransitionEffect effectType={item.effectType} config={item.config} />
    default:
      return null
  }
}

export const EffectTrackRenderer: React.FC<EffectTrackRendererProps> = ({ items, fps }) => {
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => {
        const startFrame = Math.round(item.startTime * fps)
        const durationInFrames = Math.max(1, Math.round((item.endTime - item.startTime) * fps))

        return (
          <Sequence key={item.id} from={startFrame} durationInFrames={durationInFrames}>
            <EffectItemRenderer item={item} fps={fps} />
          </Sequence>
        )
      })}
    </>
  )
}
