import { getDimensionsForAspectRatio } from '@/app/reactvideoeditor/pro/utils/aspect-ratio-transform'
import { captionTemplates } from '@/app/reactvideoeditor/pro/templates/caption-templates'
import {
  OverlayType,
  type AspectRatio,
  type Caption,
  type CaptionOverlay,
  type CaptionStyles,
  type ClipOverlay,
  type Overlay,
  type OverlayMediaSegment,
} from '@/app/reactvideoeditor/pro/types'
import {
  CompositionDataSchema,
  type CompositionData,
} from '@/lib/composition-data'
import {
  buildDisplaySubtitles,
  EDITOR_FPS,
  getSubtitleDisplaySettings,
  getPlaybackSegments,
  mapSourceTimeToTimelineTime,
  normalizeSilenceRegions,
  type PlaybackSegment,
} from '@/lib/editor'

const DEFAULT_FPS = EDITOR_FPS
const DEFAULT_SUBTITLE_FONT_FAMILY = 'Noto Sans JP, sans-serif'
const DEFAULT_BACKGROUND_COLOR = '#000000'
const DEFAULT_CAPTION_BOX_WIDTH_RATIO = 0.88
const DEFAULT_CAPTION_BOX_HEIGHT_RATIO = 0.26

type SubtitleStyleName = 'default' | 'youtuber' | 'minimal' | 'bold' | 'outline'

const captionTemplateBySubtitleStyle: Record<SubtitleStyleName, keyof typeof captionTemplates> = {
  default: 'classic',
  youtuber: 'hustle',
  minimal: 'minimal',
  bold: 'hustle',
  outline: 'classic',
}

export interface PersistedRveEditorState {
  overlays: Overlay[]
  aspectRatio: AspectRatio
  backgroundColor: string
  playbackRate: number
  currentFrame: number
  durationInFrames: number
  selectedOverlayId: number | null
  selectedOverlayIds: number[]
}

export interface PersistedRveDocument {
  kind: 'rve-pro'
  version: 1
  editorState: PersistedRveEditorState
}

export interface ProjectVideoSource {
  duration: number
  previewUrl: string
  width?: number | null
  height?: number | null
}

export interface ProjectSubtitleSource {
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
  fontFamily?: string | null
  isItalic?: boolean | null
  strokeColor?: string | null
  strokeWidth?: number | null
}

export interface ProjectStyleSource {
  subtitleSettings?: Record<string, unknown> | null
}

export interface ProjectSuggestionSource {
  type?: string | null
  isApplied?: boolean | null
}

export interface ProjectVideoEditorSource extends ProjectVideoSource {
  silenceDetected?: unknown
}

export interface ProjectEditorSeed {
  compositionData?: string | null
  videos: ProjectVideoEditorSource[]
  subtitles?: ProjectSubtitleSource[] | null
  style?: ProjectStyleSource | null
  aiSuggestions?: ProjectSuggestionSource[] | null
}

export interface PersistedExportStateSubtitle {
  text: string
  startTime: number
  endTime: number
  position: 'top' | 'center' | 'bottom'
  fontSize: number
  fontColor: string
  backgroundColor: string | null
  isBold: boolean
}

export interface PersistedExportState {
  subtitles: PersistedExportStateSubtitle[]
  playbackSegments: PlaybackSegment[] | null
}

interface ResolvedSubtitleStyle {
  position: 'top' | 'center' | 'bottom'
  styleName: SubtitleStyleName
  fontFamily: string
  fontSize: string
  fontColor: string
  backgroundColor?: string
  isBold: boolean
  strokeColor?: string
  strokeWidth?: number
}

interface SubtitleCaptionGroup {
  styles: CaptionStyles
  position: 'top' | 'center' | 'bottom'
  captions: Caption[]
  template: string
}

export function inferAspectRatio(width?: number | null, height?: number | null): AspectRatio {
  if (!width || !height) {
    return '16:9'
  }

  const ratio = width / height

  if (ratio < 0.7) {
    return '9:16'
  }

  if (ratio < 0.9) {
    return '4:5'
  }

  if (ratio < 1.1) {
    return '1:1'
  }

  return '16:9'
}

export function createDefaultProjectEditorState(video: ProjectVideoSource | null): PersistedRveEditorState {
  if (!video) {
    return {
      overlays: [],
      aspectRatio: '16:9',
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      playbackRate: 1,
      currentFrame: 0,
      durationInFrames: DEFAULT_FPS * 10,
      selectedOverlayId: null,
      selectedOverlayIds: [],
    }
  }

  const aspectRatio = inferAspectRatio(video.width, video.height)
  const canvas = getDimensionsForAspectRatio(aspectRatio)
  const durationInFrames = Math.max(DEFAULT_FPS, Math.ceil(video.duration * DEFAULT_FPS))
  const videoOverlay: ClipOverlay = {
    id: 1,
    type: OverlayType.VIDEO,
    content: video.previewUrl,
    src: video.previewUrl,
    from: 0,
    durationInFrames,
    left: 0,
    top: 0,
    width: canvas.width,
    height: canvas.height,
    row: 0,
    rotation: 0,
    isDragging: false,
    videoStartTime: 0,
    mediaSrcDuration: video.duration,
    styles: {
      opacity: 1,
      zIndex: 1,
      transform: 'none',
      objectFit: 'cover',
      animation: {
        enter: 'none',
        exit: 'none',
      }, 
    },
  }

  return {
    overlays: [videoOverlay],
    aspectRatio,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    playbackRate: 1,
    currentFrame: 0,
    durationInFrames,
    selectedOverlayId: videoOverlay.id,
    selectedOverlayIds: [videoOverlay.id],
  }
}

function safeJsonParse(value: string | null | undefined): unknown {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseLegacyCompositionData(value: string | null | undefined): CompositionData | null {
  const parsed = safeJsonParse(value)
  const result = CompositionDataSchema.safeParse(parsed)
  return result.success ? result.data : null
}

function normalizeSubtitleStyle(value: string | null | undefined): SubtitleStyleName {
  switch (value?.toLowerCase()) {
    case 'youtuber':
      return 'youtuber'
    case 'minimal':
      return 'minimal'
    case 'bold':
      return 'bold'
    case 'outline':
      return 'outline'
    default:
      return 'default'
  }
}

function resolveSubtitlePosition(value: string | null | undefined): 'top' | 'center' | 'bottom' {
  switch (value) {
    case 'top':
    case 'top-center':
      return 'top'
    case 'center':
    case 'middle':
    case 'center-center':
      return 'center'
    default:
      return 'bottom'
  }
}

function toFontSizeCss(value?: number | null) {
  const size = Number.isFinite(value) ? Number(value) : 24
  return `${Math.max(28, Math.round(size * 1.8))}px`
}

function toSafeColor(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback
}

function toSafeOptionalColor(value: string | null | undefined) {
  return value?.trim() ? value : undefined
}

function toSubtitleSourcesFromLegacy(legacy: CompositionData | null): ProjectSubtitleSource[] {
  if (!legacy) {
    return []
  }

  if (legacy.subtitleTrack.length > 0) {
    return legacy.subtitleTrack.map((subtitle) => ({
      id: subtitle.id,
      text: subtitle.text,
      startTime: subtitle.startTime,
      endTime: subtitle.endTime,
      style: 'default',
      position: subtitle.position,
      fontSize: subtitle.fontSize,
      fontColor: subtitle.fontColor,
      backgroundColor: subtitle.backgroundColor ?? null,
      isBold: subtitle.isBold,
      fontFamily: subtitle.fontFamily,
      isItalic: subtitle.isItalic,
      strokeColor: subtitle.strokeColor,
      strokeWidth: subtitle.strokeWidth,
    }))
  }

  return legacy.captionTrack.map((caption) => ({
    id: caption.id,
    text: caption.text,
    startTime: caption.startMs / 1000,
    endTime: caption.endMs / 1000,
    style: 'default',
    position: 'bottom',
  }))
}

function isSilenceCutApplied(aiSuggestions?: ProjectSuggestionSource[] | null) {
  return (aiSuggestions ?? []).some((suggestion) => {
    if (!suggestion.isApplied) {
      return false
    }

    const normalized = suggestion.type?.toLowerCase().replace(/_/g, '-') ?? ''
    return normalized === 'silence-cut'
  })
}

function hasIdentityPlaybackSegments(duration: number, segments: PlaybackSegment[]) {
  if (segments.length !== 1) {
    return false
  }

  const [segment] = segments
  return (
    Math.abs(segment.sourceStart) < 0.001 &&
    Math.abs(segment.timelineStart) < 0.001 &&
    Math.abs(segment.sourceEnd - duration) < 0.001 &&
    Math.abs(segment.timelineEnd - duration) < 0.001
  )
}

function toOverlayMediaSegments(segments: PlaybackSegment[], duration: number): OverlayMediaSegment[] | undefined {
  if (segments.length === 0 || hasIdentityPlaybackSegments(duration, segments)) {
    return undefined
  }

  return segments.map((segment) => ({
    startFrame: Math.max(0, Math.round(segment.sourceStart * DEFAULT_FPS)),
    endFrame: Math.max(1, Math.round(segment.sourceEnd * DEFAULT_FPS)),
  }))
}

function getPlaybackSegmentsForProject(
  video: ProjectVideoEditorSource,
  aiSuggestions?: ProjectSuggestionSource[] | null,
  legacy?: CompositionData | null,
) {
  const legacySegments = legacy?.videoTrack[0]?.playbackSegments ?? []
  if (legacySegments.length > 0) {
    return legacySegments
  }

  return getPlaybackSegments(
    video.duration,
    normalizeSilenceRegions(video.silenceDetected),
    isSilenceCutApplied(aiSuggestions),
  )
}

function getTimelineDurationInFrames(duration: number, segments: PlaybackSegment[]) {
  const durationSeconds = segments.at(-1)?.timelineEnd ?? duration
  return Math.max(DEFAULT_FPS, Math.ceil(durationSeconds * DEFAULT_FPS))
}

function resolveStyleSubtitleSettings(style?: ProjectStyleSource | null) {
  return style?.subtitleSettings ?? null
}

function resolveSubtitleStyle(
  subtitle: ProjectSubtitleSource,
  styleSettings?: Record<string, unknown> | null,
): ResolvedSubtitleStyle {
  const styleName = normalizeSubtitleStyle(subtitle.style)
  const templateKey = captionTemplateBySubtitleStyle[styleName]
  const template = captionTemplates[templateKey]?.styles ?? captionTemplates.classic.styles
  const preferredPosition = typeof styleSettings?.position === 'string' ? styleSettings.position : null
  const preferredFontSize = typeof styleSettings?.size === 'number' ? styleSettings.size : null
  const preferredFontColor = typeof styleSettings?.color === 'string' ? styleSettings.color : null
  const preferredBackgroundColor =
    typeof styleSettings?.backgroundColor === 'string' ? styleSettings.backgroundColor : null
  const preferredFontFamily = typeof styleSettings?.font === 'string' ? styleSettings.font : null

  return {
    position: resolveSubtitlePosition(subtitle.position ?? preferredPosition),
    styleName,
    fontFamily: preferredFontFamily ?? subtitle.fontFamily ?? template.fontFamily ?? DEFAULT_SUBTITLE_FONT_FAMILY,
    fontSize: toFontSizeCss(subtitle.fontSize ?? preferredFontSize),
    fontColor: toSafeColor(subtitle.fontColor ?? preferredFontColor, template.color),
    backgroundColor: toSafeOptionalColor(subtitle.backgroundColor ?? preferredBackgroundColor ?? template.backgroundColor),
    isBold: Boolean(subtitle.isBold ?? (styleName === 'bold' || styleName === 'youtuber')),
    strokeColor: toSafeOptionalColor(subtitle.strokeColor),
    strokeWidth: subtitle.strokeWidth ?? undefined,
  }
}

function buildCaptionStyles(style: ResolvedSubtitleStyle): CaptionStyles {
  const template = captionTemplates[captionTemplateBySubtitleStyle[style.styleName]]?.styles ?? captionTemplates.classic.styles
  const highlightStyle = {
    ...template.highlightStyle,
  }

  const textShadow =
    style.styleName === 'outline' || (style.strokeColor && style.strokeWidth)
      ? [
          `0 0 1px ${style.strokeColor ?? '#000000'}`,
          `0 0 2px ${style.strokeColor ?? '#000000'}`,
          `0 2px 18px rgba(0,0,0,0.45)`,
        ].join(', ')
      : template.textShadow

  return {
    ...template,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.fontColor,
    backgroundColor: style.backgroundColor,
    fontWeight: style.isBold ? 800 : (template.fontWeight ?? 500),
    textShadow,
    highlightStyle,
  }
}

function createCaptionWords(text: string, startMs: number, endMs: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return []
  }

  const tokens = normalized.includes(' ')
    ? normalized.split(/\s+/).filter(Boolean)
    : Array.from(normalized).filter((token) => token.trim().length > 0)

  const safeTokens = tokens.length > 0 ? tokens : [normalized]
  const duration = Math.max(1, endMs - startMs)
  const slice = duration / safeTokens.length

  return safeTokens.map((token, index) => ({
    word: token,
    startMs: Math.round(startMs + slice * index),
    endMs: Math.round(index === safeTokens.length - 1 ? endMs : startMs + slice * (index + 1)),
    confidence: 1,
  }))
}

function hasVisibleSegmentOverlap(startTime: number, endTime: number, segments: PlaybackSegment[]) {
  return segments.some((segment) => endTime > segment.sourceStart && startTime < segment.sourceEnd)
}

function getCaptionBounds(position: 'top' | 'center' | 'bottom', canvas: { width: number; height: number }) {
  const width = Math.round(canvas.width * DEFAULT_CAPTION_BOX_WIDTH_RATIO)
  const height = Math.round(canvas.height * DEFAULT_CAPTION_BOX_HEIGHT_RATIO)
  const left = Math.round((canvas.width - width) / 2)

  if (position === 'top') {
    return { left, top: Math.round(canvas.height * 0.06), width, height }
  }

  if (position === 'center') {
    return { left, top: Math.round((canvas.height - height) / 2), width, height }
  }

  return { left, top: Math.round(canvas.height - height - canvas.height * 0.08), width, height }
}

function getCaptionGroupKey(style: ResolvedSubtitleStyle) {
  return [
    style.position,
    style.styleName,
    style.fontFamily,
    style.fontSize,
    style.fontColor,
    style.backgroundColor ?? '',
    style.isBold ? '1' : '0',
    style.strokeColor ?? '',
    style.strokeWidth ?? '',
  ].join('|')
}

function buildCaptionOverlays(
  subtitles: ProjectSubtitleSource[],
  playbackSegments: PlaybackSegment[],
  canvas: { width: number; height: number },
  style?: ProjectStyleSource | null,
  startId = 2,
) {
  const groups = new Map<string, SubtitleCaptionGroup>()
  const styleSettings = resolveStyleSubtitleSettings(style)
  const displaySubtitles = buildDisplaySubtitles(
    subtitles.map((subtitle) => ({
      id: subtitle.id,
      text: subtitle.text,
      startTime: subtitle.startTime ?? 0,
      endTime: subtitle.endTime ?? subtitle.startTime ?? 0,
      style: subtitle.style ?? undefined,
      position: subtitle.position ?? undefined,
      fontSize: subtitle.fontSize ?? undefined,
      fontColor: subtitle.fontColor ?? undefined,
      backgroundColor: subtitle.backgroundColor ?? null,
      isBold: subtitle.isBold ?? undefined,
      start: subtitle.startTime != null ? Math.round(subtitle.startTime * 1000) : undefined,
      end: subtitle.endTime != null ? Math.round(subtitle.endTime * 1000) : undefined,
      fontFamily: subtitle.fontFamily ?? undefined,
    })),
    getSubtitleDisplaySettings(style?.subtitleSettings),
  )

  for (const subtitle of displaySubtitles) {
    const startTime = Math.max(0, subtitle.startTime ?? 0)
    const endTime = Math.max(startTime + 0.12, subtitle.endTime ?? startTime + 1)

    if (playbackSegments.length > 0 && !hasVisibleSegmentOverlap(startTime, endTime, playbackSegments)) {
      continue
    }

    const mappedStart = playbackSegments.length > 0
      ? mapSourceTimeToTimelineTime(startTime, playbackSegments)
      : startTime
    const mappedEnd = playbackSegments.length > 0
      ? mapSourceTimeToTimelineTime(endTime, playbackSegments)
      : endTime
    const safeEnd = Math.max(mappedStart + 0.12, mappedEnd)
    const resolvedStyle = resolveSubtitleStyle(subtitle, styleSettings)
    const groupKey = getCaptionGroupKey(resolvedStyle)
    const caption: Caption = {
      text: subtitle.text,
      startMs: Math.round(mappedStart * 1000),
      endMs: Math.round(safeEnd * 1000),
      timestampMs: Math.round(mappedStart * 1000),
      confidence: 1,
      words: createCaptionWords(subtitle.text, Math.round(mappedStart * 1000), Math.round(safeEnd * 1000)),
    }

    const existingGroup = groups.get(groupKey)
    if (existingGroup) {
      existingGroup.captions.push(caption)
      continue
    }

    groups.set(groupKey, {
      styles: buildCaptionStyles(resolvedStyle),
      position: resolvedStyle.position,
      captions: [caption],
      template: captionTemplateBySubtitleStyle[resolvedStyle.styleName],
    })
  }

  return Array.from(groups.values())
    .filter((group) => group.captions.length > 0)
    .sort((a, b) => a.position.localeCompare(b.position))
    .map<CaptionOverlay>((group, index) => {
      const bounds = getCaptionBounds(group.position, canvas)
      const lastEndMs = group.captions.at(-1)?.endMs ?? 1000

      return {
        id: startId + index,
        type: OverlayType.CAPTION,
        from: 0,
        durationInFrames: Math.max(1, Math.ceil((lastEndMs / 1000) * DEFAULT_FPS)),
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        row: index + 1,
        rotation: 0,
        isDragging: false,
        captions: group.captions,
        styles: group.styles,
        template: group.template,
      }
    })
}

function shiftCaptionToOverlayRelative(caption: Caption): Caption {
  const offsetMs = caption.startMs

  return {
    ...caption,
    startMs: 0,
    endMs: Math.max(120, caption.endMs - offsetMs),
    timestampMs: 0,
    words: caption.words.map((word) => ({
      ...word,
      startMs: Math.max(0, word.startMs - offsetMs),
      endMs: Math.max(1, word.endMs - offsetMs),
    })),
  }
}

function normalizeCaptionOverlaysForTimeline(overlays: Overlay[]) {
  let nextId = getMaxOverlayId(overlays) + 1

  return overlays
    .flatMap<Overlay>((overlay) => {
      if (overlay.type !== OverlayType.CAPTION) {
        return [overlay]
      }

      const normalizedCaptions = overlay.captions
        .slice()
        .sort((left, right) => left.startMs - right.startMs)

      if (normalizedCaptions.length === 0) {
        return [overlay]
      }

      return normalizedCaptions.map((caption, index) => ({
        ...overlay,
        id: index === 0 ? overlay.id : nextId++,
        from: overlay.from + Math.max(0, Math.round((caption.startMs / 1000) * DEFAULT_FPS)),
        durationInFrames: Math.max(
          1,
          Math.ceil(((caption.endMs - caption.startMs) / 1000) * DEFAULT_FPS),
        ),
        captions: [shiftCaptionToOverlayRelative(caption)],
      }))
    })
    .sort((left, right) => {
      if (left.row !== right.row) {
        return left.row - right.row
      }

      return left.from - right.from
    })
}

function getMaxOverlayId(overlays: Overlay[]) {
  return overlays.reduce((max, overlay) => Math.max(max, overlay.id), 0)
}

function buildVideoOverlay(
  sourceVideo: ProjectVideoEditorSource,
  canvas: { width: number; height: number },
  durationInFrames: number,
  overlaySegments: OverlayMediaSegment[] | undefined,
  playbackRate = 1,
  volume = 1,
  fit: 'cover' | 'contain' | 'fill' = 'cover',
  id = 1,
): ClipOverlay {
  return {
    id,
    type: OverlayType.VIDEO,
    content: sourceVideo.previewUrl,
    src: sourceVideo.previewUrl,
    from: 0,
    durationInFrames,
    left: 0,
    top: 0,
    width: canvas.width,
    height: canvas.height,
    row: 0,
    rotation: 0,
    isDragging: false,
    videoStartTime: 0,
    mediaSrcDuration: sourceVideo.duration,
    speed: playbackRate,
    segments: overlaySegments,
    styles: {
      opacity: 1,
      zIndex: 1,
      transform: 'none',
      objectFit: fit,
      volume,
      animation: {
        enter: 'none',
        exit: 'none',
      },
    },
  }
}

function hydratePersistedEditorState(
  persistedState: PersistedRveEditorState,
  sourceVideo: ProjectVideoEditorSource | undefined,
  subtitles: ProjectSubtitleSource[],
  playbackSegments: PlaybackSegment[],
  style?: ProjectStyleSource | null,
): PersistedRveEditorState {
  if (!sourceVideo) {
    return persistedState
  }

  const canvas = getDimensionsForAspectRatio(persistedState.aspectRatio)
  const durationInFrames = getTimelineDurationInFrames(sourceVideo.duration, playbackSegments)
  const overlaySegments = toOverlayMediaSegments(playbackSegments, sourceVideo.duration)
  const overlays = [...persistedState.overlays]
  const videoOverlayIndex = overlays.findIndex((overlay) => overlay.type === OverlayType.VIDEO)

  if (videoOverlayIndex === -1) {
    overlays.unshift(buildVideoOverlay(sourceVideo, canvas, durationInFrames, overlaySegments))
  } else {
    const currentVideoOverlay = overlays[videoOverlayIndex] as ClipOverlay
    if (overlaySegments && !currentVideoOverlay.segments?.length) {
      overlays[videoOverlayIndex] = {
        ...currentVideoOverlay,
        durationInFrames,
        mediaSrcDuration: currentVideoOverlay.mediaSrcDuration ?? sourceVideo.duration,
        segments: overlaySegments,
      }
    }
  }

  const generatedCaptionOverlays = subtitles.length > 0
    ? buildCaptionOverlays(
        subtitles,
        playbackSegments,
        canvas,
        style,
        getMaxOverlayId(overlays) + 1,
      )
    : []
  const existingCaptionOverlays = overlays.filter(
    (overlay): overlay is CaptionOverlay => overlay.type === OverlayType.CAPTION,
  )

  if (existingCaptionOverlays.length === 0 && generatedCaptionOverlays.length > 0) {
    overlays.push(...generatedCaptionOverlays)
  } else if (generatedCaptionOverlays.length > 0) {
    const existingCaptionCount = existingCaptionOverlays.reduce(
      (sum, overlay) => sum + overlay.captions.length,
      0,
    )
    const generatedCaptionCount = generatedCaptionOverlays.reduce(
      (sum, overlay) => sum + overlay.captions.length,
      0,
    )

    if (existingCaptionCount !== generatedCaptionCount) {
      const nonCaptionOverlays = overlays.filter((overlay) => overlay.type !== OverlayType.CAPTION)
      const mergedCaptionOverlays = generatedCaptionOverlays.map((generatedOverlay, index) => {
        const existingOverlay = existingCaptionOverlays[index]
        if (!existingOverlay) {
          return generatedOverlay
        }

        return {
          ...existingOverlay,
          from: generatedOverlay.from,
          durationInFrames: generatedOverlay.durationInFrames,
          left: generatedOverlay.left,
          top: generatedOverlay.top,
          width: generatedOverlay.width,
          height: generatedOverlay.height,
          row: generatedOverlay.row,
          captions: generatedOverlay.captions,
        }
      })

      overlays.length = 0
      overlays.push(...nonCaptionOverlays, ...mergedCaptionOverlays)
    }
  }

  const normalizedOverlays = normalizeCaptionOverlaysForTimeline(overlays)

  const normalizedDurationInFrames = Math.max(
    persistedState.durationInFrames,
    durationInFrames,
    ...normalizedOverlays.map((overlay) => overlay.from + overlay.durationInFrames),
  )
  const selectedOverlayId = persistedState.selectedOverlayId ?? normalizedOverlays[0]?.id ?? null

  return {
    ...persistedState,
    overlays: normalizedOverlays,
    durationInFrames: normalizedDurationInFrames,
    selectedOverlayId,
    selectedOverlayIds: persistedState.selectedOverlayIds.length > 0
      ? persistedState.selectedOverlayIds
      : (selectedOverlayId ? [selectedOverlayId] : []),
  }
}

export function createProjectEditorState(project: ProjectEditorSeed): PersistedRveEditorState {
  const persisted = parsePersistedRveDocument(project.compositionData)
  const legacyComposition = parseLegacyCompositionData(project.compositionData)
  const legacySubtitles = toSubtitleSourcesFromLegacy(legacyComposition)
  const sourceVideo = project.videos[0]
  const subtitles = project.subtitles?.length ? project.subtitles : legacySubtitles

  if (persisted) {
    if (!sourceVideo) {
      return persisted.editorState
    }

    return hydratePersistedEditorState(
      persisted.editorState,
      sourceVideo,
      subtitles ?? [],
      getPlaybackSegmentsForProject(sourceVideo, project.aiSuggestions, legacyComposition),
      project.style,
    )
  }

  if (!sourceVideo) {
    return createDefaultProjectEditorState(null)
  }

  const videoWidth = sourceVideo.width ?? legacyComposition?.meta.width ?? null
  const videoHeight = sourceVideo.height ?? legacyComposition?.meta.height ?? null
  const aspectRatio = inferAspectRatio(videoWidth, videoHeight)
  const canvas = getDimensionsForAspectRatio(aspectRatio)
  const playbackSegments = getPlaybackSegmentsForProject(sourceVideo, project.aiSuggestions, legacyComposition)
  const durationInFrames = getTimelineDurationInFrames(sourceVideo.duration, playbackSegments)
  const overlaySegments = toOverlayMediaSegments(playbackSegments, sourceVideo.duration)
  const legacyVideoTrack = legacyComposition?.videoTrack[0]
  const videoOverlay = buildVideoOverlay(
    sourceVideo,
    canvas,
    durationInFrames,
    overlaySegments,
    legacyVideoTrack?.playbackRate ?? 1,
    legacyVideoTrack?.volume ?? 1,
    legacyVideoTrack?.fit ?? 'cover',
  )

  const captionOverlays = buildCaptionOverlays(subtitles ?? [], playbackSegments, canvas, project.style)
  const overlays = normalizeCaptionOverlaysForTimeline([videoOverlay, ...captionOverlays])

  return {
    overlays,
    aspectRatio,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    playbackRate: legacyVideoTrack?.playbackRate ?? 1,
    currentFrame: 0,
    durationInFrames: Math.max(
      durationInFrames,
      ...overlays.map((overlay) => overlay.from + overlay.durationInFrames),
    ),
    selectedOverlayId: videoOverlay.id,
    selectedOverlayIds: [videoOverlay.id],
  }
}

function normalizePersistedEditorState(state: PersistedRveEditorState): PersistedRveEditorState {
  if (state.aspectRatio !== '16:9') {
    return state
  }

  const canvas = getDimensionsForAspectRatio(state.aspectRatio)

  return {
    ...state,
    overlays: state.overlays.map((overlay) => {
      const isLegacyFullHdVideo =
        overlay.type === OverlayType.VIDEO &&
        overlay.from === 0 &&
        overlay.width === 1920 &&
        overlay.height === 1080

      if (!isLegacyFullHdVideo) {
        return overlay
      }

      return {
        ...overlay,
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height,
        styles: {
          ...overlay.styles,
          objectFit: overlay.styles?.objectFit ?? 'cover',
        },
      }
    }),
  }
}

export function parsePersistedRveDocument(value: string | null | undefined): PersistedRveDocument | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<PersistedRveDocument>
    if (parsed.kind !== 'rve-pro' || parsed.version !== 1 || !parsed.editorState) {
      return null
    }

    return {
      kind: 'rve-pro',
      version: 1,
      editorState: normalizePersistedEditorState(parsed.editorState as PersistedRveEditorState),
    }
  } catch {
    return null
  }
}

function parseFontSizeToNumber(value: string | undefined, fallback = 24) {
  if (!value) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  if (normalized.endsWith('px')) {
    const parsed = Number.parseFloat(normalized.slice(0, -2))
    return Number.isFinite(parsed) ? Math.max(12, Math.round(parsed)) : fallback
  }

  if (normalized.endsWith('rem')) {
    const parsed = Number.parseFloat(normalized.slice(0, -3))
    return Number.isFinite(parsed) ? Math.max(12, Math.round(parsed * 16)) : fallback
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? Math.max(12, Math.round(parsed)) : fallback
}

function getSubtitlePositionFromCaptionOverlay(
  overlay: CaptionOverlay,
  aspectRatio: AspectRatio,
): 'top' | 'center' | 'bottom' {
  const canvas = getDimensionsForAspectRatio(aspectRatio)
  const centerY = overlay.top + overlay.height / 2

  if (centerY < canvas.height * 0.35) {
    return 'top'
  }

  if (centerY > canvas.height * 0.65) {
    return 'bottom'
  }

  return 'center'
}

function toPlaybackSegmentsFromOverlay(overlay: ClipOverlay): PlaybackSegment[] | null {
  if (!overlay.segments?.length) {
    return null
  }

  let cursor = 0
  return overlay.segments.map((segment, index) => {
    const speed = Math.max(0.001, segment.speed ?? 1)
    const duration = (segment.endFrame - segment.startFrame) / DEFAULT_FPS / speed
    const playbackSegment: PlaybackSegment = {
      id: `segment-${index}`,
      sourceStart: segment.startFrame / DEFAULT_FPS,
      sourceEnd: segment.endFrame / DEFAULT_FPS,
      duration,
      timelineStart: cursor,
      timelineEnd: cursor + duration,
    }

    cursor = playbackSegment.timelineEnd
    return playbackSegment
  })
}

export function extractPersistedExportState(value: string | null | undefined): PersistedExportState | null {
  const persisted = parsePersistedRveDocument(value)
  if (!persisted) {
    return null
  }

  const subtitles = persisted.editorState.overlays
    .filter((overlay): overlay is CaptionOverlay => overlay.type === OverlayType.CAPTION)
    .flatMap((overlay) => {
      const position = getSubtitlePositionFromCaptionOverlay(overlay, persisted.editorState.aspectRatio)
      const fontSize = parseFontSizeToNumber(overlay.styles?.fontSize, 24)
      const fontColor = toSafeColor(overlay.styles?.color, '#FFFFFF')
      const backgroundColor = overlay.styles?.backgroundColor ?? null
      const isBold = Number(overlay.styles?.fontWeight ?? 400) >= 600

      return overlay.captions.map((caption) => ({
        text: caption.text.trim(),
        startTime: overlay.from / DEFAULT_FPS + caption.startMs / 1000,
        endTime: overlay.from / DEFAULT_FPS + caption.endMs / 1000,
        position,
        fontSize,
        fontColor,
        backgroundColor,
        isBold,
      }))
    })
    .filter((subtitle) => subtitle.text.length > 0 && subtitle.endTime > subtitle.startTime)
    .sort((left, right) => left.startTime - right.startTime)

  const videoOverlay = persisted.editorState.overlays.find(
    (overlay): overlay is ClipOverlay => overlay.type === OverlayType.VIDEO,
  )

  return {
    subtitles,
    playbackSegments: videoOverlay ? toPlaybackSegmentsFromOverlay(videoOverlay) : null,
  }
}
