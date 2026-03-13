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

// --- Camera Motion Blur (animated circles give the blur something visible to act on) ---
function CameraMotionBlurEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const shutterAngle = (config.shutterAngle as number) ?? 180
  const samples = (config.samples as number) ?? 10
  const color = (config.color as string) ?? 'rgba(255,255,255,0.7)'
  const circleCount = (config.circleCount as number) ?? 5

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const circles = Array.from({ length: circleCount }, (_, i) => {
    const phase = i / circleCount
    const cx = width * 0.1 + (width * 0.8 * ((progress + phase) % 1))
    const cy = height * 0.3 + height * 0.4 * Math.sin((progress + phase) * Math.PI * 2)
    const r = 20 + 15 * Math.sin((progress + phase * 0.7) * Math.PI * 4)
    return { cx, cy, r, key: i }
  })

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
        <AbsoluteFill>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {circles.map((c) => (
              <circle key={c.key} cx={c.cx} cy={c.cy} r={c.r} fill={color} />
            ))}
          </svg>
        </AbsoluteFill>
      </CameraMotionBlur>
    </AbsoluteFill>
  )
}

// --- Trail (moving shape gives the trail effect visible content to render ghost frames of) ---
function TrailEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const lagInFrames = (config.lagInFrames as number) ?? 3
  const trailOpacity = (config.trailOpacity as number) ?? 0.6
  const layers = (config.layers as number) ?? 5
  const color = (config.color as string) ?? 'rgba(100,200,255,0.9)'
  const size = (config.size as number) ?? 40

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Lissajous-style path so the shape moves in a way that makes the trail clearly visible
  const cx = width * 0.1 + width * 0.8 * ((Math.sin(progress * Math.PI * 4) + 1) / 2)
  const cy = height * 0.2 + height * 0.6 * ((Math.sin(progress * Math.PI * 6 + 1) + 1) / 2)

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Trail lagInFrames={lagInFrames} trailOpacity={trailOpacity} layers={layers}>
        <AbsoluteFill>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={cx} cy={cy} r={size / 2} fill={color} />
          </svg>
        </AbsoluteFill>
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

// --- Audio Visualizer ---
// Uses noise-based simulation since real audio data requires visualizeAudio() with
// staticFile references that are not guaranteed to be available at render time.
// The noise is smoothed with a low-frequency time axis to mimic realistic bar movement.
function AudioVisualizerEffect({ config }: { config: Record<string, unknown> }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const barCount = (config.barCount as number) ?? 48
  const color = (config.color as string) ?? '#4ecdc4'
  const glowColor = (config.glowColor as string) ?? 'rgba(78,205,196,0.4)'
  const mirrored = (config.mirrored as boolean) ?? false
  const seed = (config.seed as string) ?? 'viz'
  const maxBarHeightRatio = (config.maxBarHeightRatio as number) ?? 0.3

  const vizHeight = height * maxBarHeightRatio
  const barWidth = width / barCount
  const baselineY = vizHeight

  const bars = Array.from({ length: barCount }, (_, i) => {
    // Two-octave noise sum for a more musical, layered feel
    const coarse = (noise2D(seed, i * 0.3, frame * 0.04) + 1) / 2
    const fine = (noise2D(`${seed}-fine`, i * 0.8, frame * 0.09) + 1) / 2
    const raw = coarse * 0.7 + fine * 0.3
    // Smooth the edges so the leftmost and rightmost bars taper down
    const envelope = Math.sin((i / (barCount - 1)) * Math.PI)
    const barH = raw * envelope * vizHeight
    return { barH, key: i }
  })

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={width} height={vizHeight} style={{ position: 'absolute', bottom: 0 }}>
        <defs>
          <filter id="viz-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Baseline */}
        <line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke={color} strokeWidth={1} opacity={0.4} />

        {/* Bars with optional mirror */}
        <g filter="url(#viz-glow)">
          {bars.map(({ barH, key: i }) => {
            const x = i * barWidth
            const barX = x + 1
            const bw = Math.max(1, barWidth - 2)

            return (
              <g key={i}>
                {/* Main upward bar */}
                <rect
                  x={barX}
                  y={baselineY - barH}
                  width={bw}
                  height={barH}
                  fill={color}
                  opacity={0.85}
                />
                {/* Glow overlay */}
                <rect
                  x={barX}
                  y={baselineY - barH}
                  width={bw}
                  height={barH * 0.3}
                  fill={glowColor}
                  opacity={0.5}
                />
                {/* Mirrored downward bar */}
                {mirrored && (
                  <rect
                    x={barX}
                    y={baselineY}
                    width={bw}
                    height={barH * 0.4}
                    fill={color}
                    opacity={0.25}
                  />
                )}
              </g>
            )
          })}
        </g>
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

// --- Transition (overlay-based clip/transform transitions between clips) ---
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
function EffectItemRenderer({ item }: { item: EffectItem; fps: number }) {
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
