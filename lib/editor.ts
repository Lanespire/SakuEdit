import TinySegmenterModule from 'tiny-segmenter/lib/index.js'
import type { Subtitle } from '@/components/modals'

export const EDITOR_FPS = 30
export type SubtitleDisplayMode = 'phrase' | 'single-line' | 'interval'

export interface SubtitleDisplaySettings {
  mode: SubtitleDisplayMode
  intervalSeconds: number
}

export type EditorTrackType = 'video' | 'subtitle' | 'audio'

export interface SilenceRegion {
  start: number
  end: number
}

export interface EditorMarker {
  id: string
  time: number
  type: string
  label?: string | null
  color: string
}

export interface EditorVideoAsset {
  id: string
  filename: string
  storagePath: string | null
  previewUrl: string | null
  duration: number
  waveform: number[]
  silenceRegions: SilenceRegion[]
  highlights: number[]
}

export interface DisplaySubtitleSegment {
  id: string
  text: string
  startTime: number
  endTime: number
  position?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string | null
  isBold?: boolean
}

export interface EditorAISuggestion {
  id: string
  type: string
  title: string
  description: string
  data?: Record<string, unknown> | null
  recommended: boolean
  isApplied: boolean
  icon: string
  iconBg: string
  iconColor: string
}

export interface PlaybackSegment {
  id: string
  sourceStart: number
  sourceEnd: number
  duration: number
  timelineStart: number
  timelineEnd: number
}

const suggestionVisuals: Record<
  string,
  Pick<EditorAISuggestion, 'icon' | 'iconBg' | 'iconColor' | 'recommended'>
> = {
  'silence-cut': {
    icon: 'content_cut',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-300',
    recommended: true,
  },
  'tempo-optimize': {
    icon: 'speed',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-300',
    recommended: false,
  },
  'highlight-detect': {
    icon: 'star',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-300',
    recommended: false,
  },
  'subtitle-improve': {
    icon: 'subtitles',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-200',
    recommended: false,
  },
}

export const DEFAULT_SUBTITLE_DISPLAY_SETTINGS: SubtitleDisplaySettings = {
  mode: 'phrase',
  intervalSeconds: 2,
}

const TinySegmenter = TinySegmenterModule as unknown as new () => {
  segment(input: string): string[]
}
const subtitleSegmenter = new TinySegmenter()

export function normalizeSuggestionType(value: string) {
  return value.toLowerCase().replace(/_/g, '-')
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeSubtitleText(text: string) {
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()
}

function tokenizeSubtitleText(text: string) {
  const normalized = normalizeSubtitleText(text)
  if (!normalized) {
    return []
  }

  return subtitleSegmenter
    .segment(normalized)
    .map((token) => token.trim())
    .filter(Boolean)
}

function chunkTokens(tokens: string[], maxChars: number) {
  const chunks: string[] = []
  let current = ''

  for (const token of tokens) {
    const next = `${current}${token}`
    const shouldBreak =
      current.length > 0 &&
      (next.length > maxChars || /[、。！？!?]$/.test(current))

    if (shouldBreak) {
      chunks.push(current.trim())
      current = token
      continue
    }

    current = next
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

function splitIntoTargetGroups(tokens: string[], groupCount: number) {
  if (groupCount <= 1 || tokens.length <= 1) {
    return [tokens.join('').trim()].filter(Boolean)
  }

  const totalLength = tokens.reduce((sum, token) => sum + token.length, 0)
  const targetLength = Math.max(1, Math.ceil(totalLength / groupCount))
  const groups: string[] = []
  let current = ''

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    const remainingTokens = tokens.length - index
    const next = `${current}${token}`
    const shouldBreak =
      current.length > 0 &&
      groups.length + 1 < groupCount &&
      next.length >= targetLength &&
      remainingTokens > groupCount - groups.length - 1

    if (shouldBreak) {
      groups.push(current.trim())
      current = token
      continue
    }

    current = next
  }

  if (current.trim()) {
    groups.push(current.trim())
  }

  return groups.filter(Boolean)
}

function splitSubtitleText(
  text: string,
  mode: SubtitleDisplayMode,
  intervalSeconds?: number,
  durationSeconds?: number,
) {
  const normalized = normalizeSubtitleText(text)
  if (!normalized) {
    return []
  }

  if (mode === 'interval') {
    const tokens = tokenizeSubtitleText(normalized)
    const targetCount = Math.max(1, Math.ceil((durationSeconds ?? 0) / (intervalSeconds ?? 2)))
    return splitIntoTargetGroups(tokens.length > 0 ? tokens : [normalized], targetCount)
  }

  const maxChars = mode === 'single-line' ? 18 : 12
  const punctuatedParts = normalized
    .split(/(?<=[、。！？!?])/)
    .map((part) => part.trim())
    .filter(Boolean)

  const sourceParts = punctuatedParts.length > 0 ? punctuatedParts : [normalized]

  return sourceParts.flatMap((part) => {
    if (part.length <= maxChars) {
      return [part]
    }

    const tokens = tokenizeSubtitleText(part)
    const chunks = chunkTokens(tokens.length > 0 ? tokens : [part], maxChars)
    return chunks.length > 0 ? chunks : [part]
  })
}

export function getSubtitleDisplaySettings(input: unknown): SubtitleDisplaySettings {
  const source = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const mode = source.displayMode

  return {
    mode:
      mode === 'single-line' || mode === 'interval' || mode === 'phrase'
        ? mode
        : DEFAULT_SUBTITLE_DISPLAY_SETTINGS.mode,
    intervalSeconds: clamp(
      toNumber(source.displayIntervalSeconds, DEFAULT_SUBTITLE_DISPLAY_SETTINGS.intervalSeconds),
      0.8,
      5,
    ),
  }
}

export function buildDisplaySubtitles(
  subtitles: Subtitle[],
  settings: SubtitleDisplaySettings = DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
): DisplaySubtitleSegment[] {
  return sortSubtitles(subtitles).flatMap((subtitle) => {
    const startTime = subtitle.startTime ?? 0
    const endTime = Math.max(startTime + 0.12, subtitle.endTime ?? startTime + 1)
    const durationSeconds = Math.max(0.12, endTime - startTime)
    const parts = splitSubtitleText(subtitle.text, settings.mode, settings.intervalSeconds, durationSeconds)
    const effectiveParts = parts.length > 0 ? parts : [subtitle.text.trim()]
    const segmentDuration = durationSeconds / effectiveParts.length

    return effectiveParts.map((text, index) => ({
      id: `${subtitle.id}-${settings.mode}-${index}`,
      text,
      startTime: startTime + segmentDuration * index,
      endTime:
        index === effectiveParts.length - 1
          ? endTime
          : startTime + segmentDuration * (index + 1),
      position: subtitle.position,
      fontSize: subtitle.fontSize,
      fontColor: subtitle.fontColor,
      backgroundColor: subtitle.backgroundColor,
      isBold: subtitle.isBold,
    }))
  })
}

function normalizeSubtitlePosition(value: unknown) {
  switch (value) {
    case 'top':
    case 'top-center':
      return 'top-center'
    case 'middle':
    case 'center':
    case 'center-center':
      return 'center'
    case 'bottom':
    case 'bottom-center':
    default:
      return 'bottom-center'
  }
}

function denormalizeSubtitlePosition(value: unknown) {
  switch (value) {
    case 'top-center':
    case 'top':
      return 'top'
    case 'center':
    case 'middle':
      return 'middle'
    case 'bottom-center':
    case 'bottom':
    default:
      return 'bottom'
  }
}

export function estimateSubtitleWidth(text: string) {
  const width = clamp(text.trim().length * 16 + 48, 96, 360)
  return `${width}px`
}

export function normalizeSilenceRegions(input: unknown): SilenceRegion[] {
  const regions =
    Array.isArray(input)
      ? input
      : input && typeof input === 'object' && Array.isArray((input as { regions?: unknown[] }).regions)
        ? (input as { regions: unknown[] }).regions
        : []

  return regions
    .map((region, index) => {
      const start = toNumber((region as { start?: unknown })?.start)
      const end = toNumber((region as { end?: unknown })?.end)

      if (end <= start) {
        return null
      }

      return {
        start,
        end,
        id: `silence-${index}`,
      }
    })
    .filter((region): region is SilenceRegion & { id: string } => region !== null)
    .sort((a, b) => a.start - b.start)
    .map(({ start, end }) => ({ start, end }))
}

export function normalizeWaveform(input: unknown): number[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      if (typeof entry === 'number') {
        return entry
      }

      if (entry && typeof entry === 'object' && 'amplitude' in entry) {
        return toNumber((entry as { amplitude?: unknown }).amplitude)
      }

      return 0
    })
    .filter((value) => Number.isFinite(value))
    .map((value) => clamp(value > 1 ? value / 100 : value, 0.04, 1))
}

export function normalizeHighlights(input: unknown): number[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      if (typeof entry === 'number') {
        return entry
      }

      if (entry && typeof entry === 'object' && 'time' in entry) {
        return toNumber((entry as { time?: unknown }).time)
      }

      return 0
    })
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)
}

export function toEditorSubtitle(input: {
  id: string
  text: string
  startTime?: number | null
  endTime?: number | null
  style?: string | null
  position?: string | null
  fontSize?: number | null
  fontColor?: string | null
  backgroundColor?: string | null
  isBold?: boolean | null
}): Subtitle {
  const startTime = toNumber(input.startTime)
  const endTime = Math.max(startTime + 0.2, toNumber(input.endTime, startTime + 1))

  return {
    id: input.id,
    text: input.text,
    startTime,
    endTime,
    start: Math.round(startTime * 1000),
    end: Math.round(endTime * 1000),
    style: input.style ?? 'default',
    position: normalizeSubtitlePosition(input.position),
    fontSize: input.fontSize ?? 24,
    fontColor: input.fontColor ?? '#FFFFFF',
    backgroundColor: input.backgroundColor ?? '#00000080',
    isBold: Boolean(input.isBold),
    highlight: false,
    width: estimateSubtitleWidth(input.text),
  }
}

export function toSubtitleMutationPayload(subtitle: Subtitle) {
  const startMs = subtitle.start ?? Math.round((subtitle.startTime ?? 0) * 1000)
  const endMs = subtitle.end ?? Math.round((subtitle.endTime ?? 0) * 1000)
  const startTime = clamp(startMs / 1000, 0, Number.MAX_SAFE_INTEGER)
  const endTime = Math.max(startTime + 0.1, endMs / 1000)

  return {
    text: subtitle.text.trim(),
    startTime,
    endTime,
    style: subtitle.style ?? 'default',
    position: denormalizeSubtitlePosition(subtitle.position),
    fontSize: subtitle.fontSize ?? 24,
    fontColor: subtitle.fontColor ?? '#FFFFFF',
    backgroundColor: subtitle.backgroundColor ?? null,
    isBold: Boolean(subtitle.isBold),
  }
}

export function withSuggestionVisuals(input: {
  id: string
  type: string
  title: string
  description: string
  data?: Record<string, unknown> | null
  isApplied?: boolean | null
  recommended?: boolean | null
}): EditorAISuggestion {
  const type = normalizeSuggestionType(input.type)
  const visual = suggestionVisuals[type] ?? {
    icon: 'auto_fix_high',
    iconBg: 'bg-white/10',
    iconColor: 'text-white',
    recommended: false,
  }

  return {
    id: input.id,
    type,
    title: input.title,
    description: input.description,
    data: input.data ?? null,
    isApplied: Boolean(input.isApplied),
    recommended: input.recommended ?? visual.recommended,
    icon: visual.icon,
    iconBg: visual.iconBg,
    iconColor: visual.iconColor,
  }
}

export function buildFallbackSuggestions(video: EditorVideoAsset | null) {
  if (!video) {
    return []
  }

  const fallback: EditorAISuggestion[] = []

  if (video.silenceRegions.length > 0) {
    const savedSeconds = video.silenceRegions.reduce((sum, region) => sum + (region.end - region.start), 0)
    fallback.push(
      withSuggestionVisuals({
        id: 'fallback-silence-cut',
        type: 'silence_cut',
        title: '無音カット',
        description: `${video.silenceRegions.length}箇所の無音を検出しました。適用すると約${savedSeconds.toFixed(1)}秒短縮できます。`,
      }),
    )
  }

  fallback.push(
    withSuggestionVisuals({
      id: 'fallback-tempo-optimize',
      type: 'tempo_optimize',
      title: 'テンポ最適化',
      description: '再生位置と字幕区切りを見ながら、テンポを詰めるポイントをチャットで指示できます。',
    }),
  )

  fallback.push(
    withSuggestionVisuals({
      id: 'fallback-highlight-detect',
      type: 'highlight_detect',
      title: 'ハイライト検出',
      description: '見どころ候補をマーカー化し、先頭から順に確認できる状態にします。',
    }),
  )

  return fallback
}

export function getPlaybackSegments(
  duration: number,
  silenceRegions: SilenceRegion[],
  cutApplied: boolean,
): PlaybackSegment[] {
  const safeDuration = Math.max(duration, 0.1)

  if (!cutApplied || silenceRegions.length === 0) {
    return [
      {
        id: 'segment-full',
        sourceStart: 0,
        sourceEnd: safeDuration,
        duration: safeDuration,
        timelineStart: 0,
        timelineEnd: safeDuration,
      },
    ]
  }

  const segments: PlaybackSegment[] = []
  let sourceCursor = 0
  let timelineCursor = 0

  silenceRegions.forEach((region, index) => {
    const start = clamp(region.start, 0, safeDuration)
    const end = clamp(region.end, 0, safeDuration)

    if (start > sourceCursor) {
      const durationSeconds = start - sourceCursor
      segments.push({
        id: `segment-${index}`,
        sourceStart: sourceCursor,
        sourceEnd: start,
        duration: durationSeconds,
        timelineStart: timelineCursor,
        timelineEnd: timelineCursor + durationSeconds,
      })
      timelineCursor += durationSeconds
    }

    sourceCursor = Math.max(sourceCursor, end)
  })

  if (sourceCursor < safeDuration) {
    const durationSeconds = safeDuration - sourceCursor
    segments.push({
      id: `segment-${segments.length}`,
      sourceStart: sourceCursor,
      sourceEnd: safeDuration,
      duration: durationSeconds,
      timelineStart: timelineCursor,
      timelineEnd: timelineCursor + durationSeconds,
    })
  }

  return segments.length > 0
    ? segments
    : [
        {
          id: 'segment-full',
          sourceStart: 0,
          sourceEnd: safeDuration,
          duration: safeDuration,
          timelineStart: 0,
          timelineEnd: safeDuration,
        },
      ]
}

export function mapSourceTimeToTimelineTime(sourceTime: number, segments: PlaybackSegment[]) {
  if (segments.length === 0) {
    return sourceTime
  }

  for (const segment of segments) {
    if (sourceTime <= segment.sourceStart) {
      return segment.timelineStart
    }

    if (sourceTime <= segment.sourceEnd) {
      return segment.timelineStart + (sourceTime - segment.sourceStart)
    }
  }

  return segments.at(-1)?.timelineEnd ?? sourceTime
}

export function mapTimelineTimeToSourceTime(timelineTime: number, segments: PlaybackSegment[]) {
  if (segments.length === 0) {
    return timelineTime
  }

  for (const segment of segments) {
    if (timelineTime <= segment.timelineStart) {
      return segment.sourceStart
    }

    if (timelineTime <= segment.timelineEnd) {
      return segment.sourceStart + (timelineTime - segment.timelineStart)
    }
  }

  return segments.at(-1)?.sourceEnd ?? timelineTime
}

export function getTimelineDurationSeconds(duration: number, silenceRegions: SilenceRegion[], cutApplied: boolean) {
  return getPlaybackSegments(duration, silenceRegions, cutApplied).at(-1)?.timelineEnd ?? duration
}

export function getEditorMediaDurationSeconds(
  duration: number,
  subtitles: Subtitle[] = [],
  markers: EditorMarker[] = [],
  highlights: number[] = [],
  silenceRegions: SilenceRegion[] = [],
) {
  const subtitleEnd = subtitles.reduce((max, subtitle) => Math.max(max, subtitle.endTime ?? subtitle.startTime ?? 0), 0)
  const markerEnd = markers.reduce((max, marker) => Math.max(max, marker.time), 0)
  const highlightEnd = highlights.reduce((max, time) => Math.max(max, time), 0)
  const silenceEnd = silenceRegions.reduce((max, region) => Math.max(max, region.end), 0)

  return Math.max(duration, subtitleEnd, markerEnd, highlightEnd, silenceEnd, 0.1)
}

export function getDurationInFrames(durationSeconds: number, fps = EDITOR_FPS) {
  return Math.max(1, Math.ceil(durationSeconds * fps))
}

export function formatTimelineTime(seconds: number) {
  const safeSeconds = Math.max(seconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const remainderSeconds = Math.floor(safeSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`
}

export function formatTimelineTimePrecise(seconds: number) {
  const safeSeconds = Math.max(seconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const remainderSeconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${remainderSeconds.toFixed(1).padStart(4, '0')}`
}

export function createNewSubtitle(playheadSeconds: number, existingCount: number): Subtitle {
  const startTime = clamp(playheadSeconds, 0, Number.MAX_SAFE_INTEGER)
  const endTime = startTime + 2
  const text = `新しい字幕 ${existingCount + 1}`

  return {
    id: `new-${Date.now()}`,
    text,
    startTime,
    endTime,
    start: Math.round(startTime * 1000),
    end: Math.round(endTime * 1000),
    style: 'default',
    position: 'bottom-center',
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: '#00000080',
    isBold: false,
    highlight: true,
    width: estimateSubtitleWidth(text),
  }
}

export function createHighlightMarkers(highlights: number[], prefix = 'highlight'): EditorMarker[] {
  return highlights.slice(0, 5).map((time, index) => ({
    id: `${prefix}-${index}`,
    time,
    type: 'highlight',
    label: `見どころ ${index + 1}`,
    color: '#fbbf24',
  }))
}

export function sortSubtitles(subtitles: Subtitle[]) {
  return [...subtitles].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))
}
