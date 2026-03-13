import React, { useRef } from 'react'
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
} from 'remotion'
import { Rect, Circle, Triangle, Star, Ellipse, Pie, Arrow, Heart, Polygon } from '@remotion/shapes'
import { Lottie } from '@remotion/lottie'
import { Gif } from '@remotion/gif'
import { RemotionRiveCanvas } from '@remotion/rive'
import { createRoundedTextBox } from '@remotion/rounded-text-box'
import { evolvePath } from '@remotion/paths'
import { ThreeCanvas } from '@remotion/three'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
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
        color: ((config.color as string) ?? (config.fontColor as string) ?? '#ffffff'),
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

// --- Rive overlay ---
function RiveOverlay({
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
          backgroundColor: 'rgba(80, 120, 200, 0.15)',
          border: '1px dashed rgba(80, 120, 200, 0.4)',
          borderRadius: 8,
          color: 'rgba(80, 120, 200, 0.8)',
          fontSize: 14,
          fontFamily: 'sans-serif',
        }}
      >
        Rive (no src)
      </div>
    )
  }

  return (
    <RemotionRiveCanvas
      src={src}
      artboard={(config.artboard as string | number | undefined)}
      animation={(config.stateMachine as string | number | undefined) ?? (config.animation as string | number | undefined)}
    />
  )
}

// --- Rounded text box overlay ---
function RoundedTextBoxOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const text = (config.text as string) ?? 'Text'
  const fontSize = (config.fontSize as number) ?? 24
  const color = (config.color as string) ?? '#ffffff'
  const backgroundColor = (config.backgroundColor as string) ?? 'rgba(0,0,0,0.7)'
  const borderRadius = (config.borderRadius as number) ?? 16
  const horizontalPadding = (config.horizontalPadding as number) ?? 20
  const verticalPadding = (config.verticalPadding as number) ?? 12

  // Approximate text line width for SVG path generation
  const charWidth = fontSize * 0.55
  const textWidth = text.length * charWidth
  const lineHeight = fontSize * 1.4
  const textMeasurements = [{ width: textWidth, height: lineHeight }]

  let pathD: string | null = null
  let boxWidth = width
  let boxHeight = height

  try {
    const result = createRoundedTextBox({
      textMeasurements,
      textAlign: (config.textAlign as 'left' | 'center' | 'right') ?? 'center',
      horizontalPadding,
      borderRadius,
    })
    pathD = result.d
    boxWidth = result.boundingBox.x2 - result.boundingBox.x1
    boxHeight = result.boundingBox.y2 - result.boundingBox.y1
  } catch {
    // fall through to simple box rendering
  }

  const totalWidth = textWidth + horizontalPadding * 2
  const totalHeight = lineHeight + verticalPadding * 2

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {pathD ? (
          <svg
            width={boxWidth}
            height={boxHeight}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <path d={pathD} fill={backgroundColor} />
          </svg>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor,
              borderRadius,
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            padding: `${verticalPadding}px ${horizontalPadding}px`,
            color,
            fontSize,
            fontFamily: (config.fontFamily as string) ?? 'Noto Sans JP, sans-serif',
            fontWeight: (config.fontWeight as number) ?? 700,
            whiteSpace: 'nowrap',
            lineHeight: `${lineHeight}px`,
            minWidth: totalWidth,
            minHeight: totalHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

// --- Chart overlay ---
type ChartDataPoint = { label?: string; value: number }

function buildBarChartPath(
  data: ChartDataPoint[],
  width: number,
  height: number,
  progress: number,
): string {
  if (data.length === 0) return ''
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const barWidth = (width / data.length) * 0.7
  const gap = (width / data.length) * 0.3
  let d = ''
  data.forEach((point, i) => {
    const barHeight = (point.value / maxValue) * height * progress
    const x = i * (barWidth + gap) + gap / 2
    const y = height - barHeight
    d += `M ${x} ${height} L ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${height} Z `
  })
  return d.trim()
}

function buildLineChartPath(
  data: ChartDataPoint[],
  width: number,
  height: number,
  progress: number,
): string {
  if (data.length < 2) return ''
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const step = width / (data.length - 1)

  const fullPath = data
    .map((point, i) => {
      const x = i * step
      const y = height - (point.value / maxValue) * height
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Use evolvePath for draw-on animation
  try {
    const evolved = evolvePath(progress, fullPath)
    return evolved.strokeDasharray ? fullPath : fullPath
  } catch {
    return fullPath
  }
}

function buildPieSegments(
  data: ChartDataPoint[],
  cx: number,
  cy: number,
  radius: number,
  progress: number,
): Array<{ d: string; color: string }> {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const defaultColors = ['#4f8ef7', '#f7a24f', '#4ff78e', '#f74f4f', '#c44ff7', '#f7f74f']
  const segments: Array<{ d: string; color: string }> = []
  let startAngle = -Math.PI / 2

  data.forEach((point, i) => {
    const slice = (point.value / total) * Math.PI * 2 * progress
    const endAngle = startAngle + slice
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const largeArc = slice > Math.PI ? 1 : 0
    segments.push({
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: ((point as Record<string, unknown>).color as string) ?? defaultColors[i % defaultColors.length],
    })
    startAngle = endAngle
  })
  return segments
}

function ChartOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const frame = useCurrentFrame()
  const chartType = (config.chartType as string) ?? 'bar'
  const rawData = (config.data as ChartDataPoint[] | undefined) ?? [
    { label: 'A', value: 80 },
    { label: 'B', value: 50 },
    { label: 'C', value: 65 },
    { label: 'D', value: 90 },
  ]
  const strokeColor = (config.strokeColor as string) ?? '#4f8ef7'
  const fillColor = (config.fillColor as string) ?? 'rgba(79,142,247,0.7)'
  const animationDuration = (config.animationDuration as number) ?? 30

  const progress = interpolate(frame, [0, animationDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const padding = 20

  if (chartType === 'pie') {
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - padding
    const segments = buildPieSegments(rawData, cx, cy, radius, progress)
    return (
      <svg width={width} height={height}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color} />
        ))}
      </svg>
    )
  }

  if (chartType === 'line') {
    const chartW = width - padding * 2
    const chartH = height - padding * 2
    const linePath = buildLineChartPath(rawData, chartW, chartH, 1)
    const evolved = (() => {
      try {
        return evolvePath(progress, linePath)
      } catch {
        return null
      }
    })()
    return (
      <svg width={width} height={height}>
        <g transform={`translate(${padding}, ${padding})`}>
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={3}
            strokeDasharray={evolved?.strokeDasharray ?? undefined}
            strokeDashoffset={evolved?.strokeDashoffset ?? undefined}
          />
        </g>
      </svg>
    )
  }

  // Default: bar chart
  const chartW = width - padding * 2
  const chartH = height - padding * 2
  const barPath = buildBarChartPath(rawData, chartW, chartH, progress)

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${padding}, ${padding})`}>
        <path d={barPath} fill={fillColor} stroke={strokeColor} strokeWidth={1} />
      </g>
    </svg>
  )
}

// --- 3D scene overlay ---
type GeometryType = 'box' | 'sphere' | 'torus' | 'cylinder' | 'cone'

function RotatingMesh({ geometryType, color }: { geometryType: GeometryType; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.8
      meshRef.current.rotation.y += delta * 1.2
    }
  })

  const geometry = (() => {
    switch (geometryType) {
      case 'sphere':
        return <sphereGeometry args={[1.2, 32, 32]} />
      case 'torus':
        return <torusGeometry args={[1, 0.4, 16, 64]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.8, 0.8, 2, 32]} />
      case 'cone':
        return <coneGeometry args={[1, 2, 32]} />
      case 'box':
      default:
        return <boxGeometry args={[1.8, 1.8, 1.8]} />
    }
  })()

  return (
    <mesh ref={meshRef}>
      {geometry}
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
    </mesh>
  )
}

function ThreeDSceneOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const geometryType = ((config.geometryType as string) ?? 'box') as GeometryType
  const color = (config.color as string) ?? '#4f8ef7'
  const backgroundColor = (config.backgroundColor as string) ?? 'transparent'

  return (
    <div style={{ width, height, background: backgroundColor }}>
      <ThreeCanvas width={width} height={height}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <RotatingMesh geometryType={geometryType} color={color} />
      </ThreeCanvas>
    </div>
  )
}

// --- Skia canvas overlay ---
function SkiaCanvasOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const frame = useCurrentFrame()
  const drawMode = (config.drawMode as string) ?? 'shapes'
  const primaryColor = (config.primaryColor as string) ?? '#4f8ef7'
  const secondaryColor = (config.secondaryColor as string) ?? '#f74f4f'
  const bgColor = (config.bgColor as string) ?? 'transparent'

  const animProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const cx = width / 2
  const cy = height / 2
  const maxRadius = Math.min(width, height) * 0.4

  if (drawMode === 'rings') {
    const ringCount = 4
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect width={width} height={height} fill={bgColor} />
        {Array.from({ length: ringCount }).map((_, i) => {
          const r = (maxRadius / ringCount) * (i + 1) * animProgress
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? primaryColor : secondaryColor}
              strokeWidth={3}
            />
          )
        })}
      </svg>
    )
  }

  const rectCount = 5
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill={bgColor} />
      {Array.from({ length: rectCount }).map((_, i) => {
        const size = (Math.min(width, height) * 0.8 * (rectCount - i)) / rectCount
        const alpha = Math.round(((i + 1) / rectCount) * 255 * animProgress)
          .toString(16)
          .padStart(2, '0')
        return (
          <rect
            key={i}
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            rx={8 + i * 4}
            ry={8 + i * 4}
            fill="none"
            stroke={`${i % 2 === 0 ? primaryColor : secondaryColor}${alpha}`}
            strokeWidth={2}
          />
        )
      })}
    </svg>
  )
}

// --- Map overlay ---
function MapOverlay({
  config,
  width,
  height,
}: {
  config: Record<string, unknown>
  width: number
  height: number
}) {
  const lat = (config.lat as number) ?? 35.6812
  const lng = (config.lng as number) ?? 139.7671
  const zoom = (config.zoom as number) ?? 12
  const markerColor = (config.markerColor as string) ?? '#f74f4f'
  const gridColor = 'rgba(100,150,200,0.3)'
  const bgColor = (config.bgColor as string) ?? '#1a2a3a'
  const label = (config.label as string) ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`

  const gridLines = 8
  const gridStepX = width / gridLines
  const gridStepY = height / gridLines

  // Marker position (center)
  const mx = width / 2
  const my = height / 2

  return (
    <svg width={width} height={height} style={{ borderRadius: 8 }}>
      {/* Background */}
      <rect width={width} height={height} fill={bgColor} rx={8} />

      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <line
            x1={i * gridStepX}
            y1={0}
            x2={i * gridStepX}
            y2={height}
            stroke={gridColor}
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={i * gridStepY}
            x2={width}
            y2={i * gridStepY}
            stroke={gridColor}
            strokeWidth={1}
          />
        </React.Fragment>
      ))}

      {/* Crosshair at center */}
      <line x1={mx - 20} y1={my} x2={mx + 20} y2={my} stroke={markerColor} strokeWidth={2} />
      <line x1={mx} y1={my - 20} x2={mx} y2={my + 20} stroke={markerColor} strokeWidth={2} />

      {/* Marker pin */}
      <circle cx={mx} cy={my} r={10} fill={markerColor} opacity={0.9} />
      <circle cx={mx} cy={my} r={4} fill="#ffffff" />

      {/* Ripple effect ring */}
      <circle
        cx={mx}
        cy={my}
        r={20}
        fill="none"
        stroke={markerColor}
        strokeWidth={2}
        opacity={0.4}
      />

      {/* Coordinate label */}
      <rect
        x={8}
        y={height - 32}
        width={width - 16}
        height={24}
        rx={4}
        fill="rgba(0,0,0,0.5)"
      />
      <text
        x={width / 2}
        y={height - 14}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={11}
        fontFamily="monospace"
      >
        {label}
      </text>

      {/* Zoom indicator */}
      <text
        x={width - 8}
        y={16}
        textAnchor="end"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontFamily="monospace"
      >
        z{zoom}
      </text>
    </svg>
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
    case 'rive':
      content = <RiveOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'rounded-text-box':
      content = <RoundedTextBoxOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'chart':
      content = <ChartOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case '3d-scene':
      content = <ThreeDSceneOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'skia-canvas':
      content = <SkiaCanvasOverlay config={item.overlayConfig} width={width} height={height} />
      break
    case 'map':
      content = <MapOverlay config={item.overlayConfig} width={width} height={height} />
      break
    default:
      content = (
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
          {item.overlayType}
        </div>
      )
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
