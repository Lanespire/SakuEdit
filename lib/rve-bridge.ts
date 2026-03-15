import { useCallback, useMemo } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'
import { getDimensionsForAspectRatio } from '@/app/reactvideoeditor/pro/utils/aspect-ratio-transform'
import {
  OverlayType,
  type CaptionOverlay,
  type CaptionStyles,
  type ClipOverlay,
  type ImageOverlay,
  type Overlay,
  type OverlayMediaSegment,
  type SoundOverlay,
  type TextOverlay,
} from '@/app/reactvideoeditor/pro/types'
import { EDITOR_FPS, type SilenceRegion } from '@/lib/editor'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface SubtitleData {
  text: string
  startTime: number // seconds
  endTime: number   // seconds
  position?: 'top' | 'center' | 'bottom'
}

export interface CanvasSize {
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getMaxOverlayId(overlays: Overlay[]): number {
  return overlays.reduce((max, overlay) => Math.max(max, overlay.id), 0)
}

const DEFAULT_CAPTION_BOX_WIDTH_RATIO = 0.88
const DEFAULT_CAPTION_BOX_HEIGHT_RATIO = 0.26

function getCaptionBounds(position: 'top' | 'center' | 'bottom', canvas: CanvasSize) {
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

const DEFAULT_CAPTION_STYLES: CaptionStyles = {
  fontFamily: 'Noto Sans JP, sans-serif',
  fontSize: '43px',
  lineHeight: 1.4,
  textAlign: 'center',
  color: '#FFFFFF',
  fontWeight: 500,
  textShadow: '0 2px 18px rgba(0,0,0,0.45)',
}

// ---------------------------------------------------------------------------
// 1. Caption overlay bridge
// ---------------------------------------------------------------------------

export function getCaptionOverlays(overlays: Overlay[]): CaptionOverlay[] {
  return overlays.filter(
    (overlay): overlay is CaptionOverlay => overlay.type === OverlayType.CAPTION,
  )
}

export function createCaptionOverlay(
  subtitle: SubtitleData,
  canvas: CanvasSize,
  nextId: number,
): CaptionOverlay {
  const position = subtitle.position ?? 'bottom'
  const bounds = getCaptionBounds(position, canvas)
  const startMs = Math.round(subtitle.startTime * 1000)
  const endMs = Math.round(subtitle.endTime * 1000)
  const fromFrame = Math.max(0, Math.round(subtitle.startTime * EDITOR_FPS))
  const durationInFrames = Math.max(1, Math.ceil((subtitle.endTime - subtitle.startTime) * EDITOR_FPS))

  return {
    id: nextId,
    type: OverlayType.CAPTION,
    from: fromFrame,
    durationInFrames,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    row: 1,
    rotation: 0,
    isDragging: false,
    captions: [
      {
        text: subtitle.text,
        startMs: 0,
        endMs: Math.max(120, endMs - startMs),
        timestampMs: 0,
        confidence: 1,
        words: createCaptionWords(subtitle.text, 0, Math.max(120, endMs - startMs)),
      },
    ],
    styles: { ...DEFAULT_CAPTION_STYLES },
    template: 'classic',
  }
}

export function updateCaptionText(overlay: CaptionOverlay, newText: string): CaptionOverlay {
  return {
    ...overlay,
    captions: overlay.captions.map((caption) => ({
      ...caption,
      text: newText,
      words: createCaptionWords(newText, caption.startMs, caption.endMs),
    })),
  }
}

export function rebuildCaptionOverlays(
  subtitles: SubtitleData[],
  overlays: Overlay[],
  canvas: CanvasSize,
): Overlay[] {
  const nonCaptionOverlays = overlays.filter(
    (overlay) => overlay.type !== OverlayType.CAPTION,
  )
  let nextId = getMaxOverlayId(overlays) + 1

  const newCaptionOverlays = subtitles.map((subtitle) => {
    const captionOverlay = createCaptionOverlay(subtitle, canvas, nextId)
    nextId += 1
    return captionOverlay
  })

  return [...nonCaptionOverlays, ...newCaptionOverlays]
}

// ---------------------------------------------------------------------------
// 2. Silence cut bridge
// ---------------------------------------------------------------------------

export function applySilenceCut(
  videoOverlay: ClipOverlay,
  silenceRegions: SilenceRegion[],
  fps: number = EDITOR_FPS,
): ClipOverlay {
  if (silenceRegions.length === 0) {
    return videoOverlay
  }

  const mediaDuration = videoOverlay.mediaSrcDuration ?? videoOverlay.durationInFrames / fps
  const totalFrames = Math.round(mediaDuration * fps)

  // Build segments by removing silence regions from source
  const segments: OverlayMediaSegment[] = []
  let sourceCursor = 0

  const sortedRegions = [...silenceRegions].sort((a, b) => a.start - b.start)

  for (const region of sortedRegions) {
    const regionStartFrame = Math.max(0, Math.round(region.start * fps))
    const regionEndFrame = Math.min(totalFrames, Math.round(region.end * fps))

    if (regionStartFrame > sourceCursor) {
      segments.push({
        startFrame: sourceCursor,
        endFrame: regionStartFrame,
      })
    }
    sourceCursor = Math.max(sourceCursor, regionEndFrame)
  }

  if (sourceCursor < totalFrames) {
    segments.push({
      startFrame: sourceCursor,
      endFrame: totalFrames,
    })
  }

  if (segments.length === 0) {
    return videoOverlay
  }

  const newDurationFrames = segments.reduce(
    (sum, segment) => sum + (segment.endFrame - segment.startFrame),
    0,
  )

  return {
    ...videoOverlay,
    segments,
    durationInFrames: Math.max(1, newDurationFrames),
  }
}

export function removeSilenceCut(videoOverlay: ClipOverlay): ClipOverlay {
  const mediaDuration = videoOverlay.mediaSrcDuration
  const durationInFrames = mediaDuration
    ? Math.max(EDITOR_FPS, Math.ceil(mediaDuration * EDITOR_FPS))
    : videoOverlay.durationInFrames

  return {
    ...videoOverlay,
    segments: undefined,
    durationInFrames,
  }
}

// ---------------------------------------------------------------------------
// 3. Media overlay bridge
// ---------------------------------------------------------------------------

export function createTextOverlay(
  text: string,
  canvas: CanvasSize,
  nextId: number,
): TextOverlay {
  const width = Math.min(Math.round(canvas.width * 0.6), 600)
  const height = 80

  return {
    id: nextId,
    type: OverlayType.TEXT,
    content: text,
    from: 0,
    durationInFrames: EDITOR_FPS * 5,
    left: Math.round((canvas.width - width) / 2),
    top: Math.round((canvas.height - height) / 2),
    width,
    height,
    row: 1,
    rotation: 0,
    isDragging: false,
    styles: {
      fontSize: '36px',
      fontWeight: '500',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      fontFamily: 'Noto Sans JP, sans-serif',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      opacity: 1,
    },
  }
}

export function createImageOverlay(
  src: string,
  canvas: CanvasSize,
  nextId: number,
): ImageOverlay {
  const size = Math.round(Math.min(canvas.width, canvas.height) * 0.4)

  return {
    id: nextId,
    type: OverlayType.IMAGE,
    src,
    from: 0,
    durationInFrames: EDITOR_FPS * 5,
    left: Math.round((canvas.width - size) / 2),
    top: Math.round((canvas.height - size) / 2),
    width: size,
    height: size,
    row: 1,
    rotation: 0,
    isDragging: false,
    styles: {
      opacity: 1,
      objectFit: 'contain',
    },
  }
}

export function createAudioOverlay(
  src: string,
  duration: number,
  nextId: number,
): SoundOverlay {
  return {
    id: nextId,
    type: OverlayType.SOUND,
    content: src,
    src,
    from: 0,
    durationInFrames: Math.max(1, Math.ceil(duration * EDITOR_FPS)),
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    row: 2,
    rotation: 0,
    isDragging: false,
    mediaSrcDuration: duration,
    styles: {
      volume: 1,
    },
  }
}

// ---------------------------------------------------------------------------
// 4. React Hook
// ---------------------------------------------------------------------------

export function useRveBridge() {
  const {
    overlays,
    addOverlay,
    changeOverlay,
    deleteOverlay,
    setOverlays,
    selectedOverlayId,
    aspectRatio,
  } = useEditorContext()

  const canvas = useMemo(() => getDimensionsForAspectRatio(aspectRatio), [aspectRatio])

  // --- Caption helpers ---

  const captionOverlays = useMemo(() => getCaptionOverlays(overlays), [overlays])

  const addSubtitle = useCallback(
    (subtitle: SubtitleData) => {
      const nextId = getMaxOverlayId(overlays) + 1
      addOverlay(createCaptionOverlay(subtitle, canvas, nextId))
    },
    [overlays, canvas, addOverlay],
  )

  const updateSubtitle = useCallback(
    (overlayId: number, text: string) => {
      changeOverlay(overlayId, (overlay) => {
        if (overlay.type !== OverlayType.CAPTION) {
          return overlay
        }
        return updateCaptionText(overlay as CaptionOverlay, text)
      })
    },
    [changeOverlay],
  )

  const removeSubtitle = useCallback(
    (overlayId: number) => {
      deleteOverlay(overlayId)
    },
    [deleteOverlay],
  )

  const rebuildSubtitles = useCallback(
    (subtitles: SubtitleData[]) => {
      setOverlays(rebuildCaptionOverlays(subtitles, overlays, canvas))
    },
    [overlays, canvas, setOverlays],
  )

  // --- Silence cut helpers ---

  const applySilenceCutAction = useCallback(
    (silenceRegions: SilenceRegion[]) => {
      const videoOverlay = overlays.find(
        (overlay): overlay is ClipOverlay => overlay.type === OverlayType.VIDEO,
      )
      if (!videoOverlay) {
        return
      }

      const updated = applySilenceCut(videoOverlay, silenceRegions, EDITOR_FPS)
      changeOverlay(videoOverlay.id, () => updated)
    },
    [overlays, changeOverlay],
  )

  const removeSilenceCutAction = useCallback(() => {
    const videoOverlay = overlays.find(
      (overlay): overlay is ClipOverlay => overlay.type === OverlayType.VIDEO,
    )
    if (!videoOverlay) {
      return
    }

    const updated = removeSilenceCut(videoOverlay)
    changeOverlay(videoOverlay.id, () => updated)
  }, [overlays, changeOverlay])

  // --- Media helpers ---

  const addText = useCallback(
    (text: string) => {
      const nextId = getMaxOverlayId(overlays) + 1
      addOverlay(createTextOverlay(text, canvas, nextId))
    },
    [overlays, canvas, addOverlay],
  )

  const addImage = useCallback(
    (src: string) => {
      const nextId = getMaxOverlayId(overlays) + 1
      addOverlay(createImageOverlay(src, canvas, nextId))
    },
    [overlays, canvas, addOverlay],
  )

  const addAudio = useCallback(
    (src: string, duration: number) => {
      const nextId = getMaxOverlayId(overlays) + 1
      addOverlay(createAudioOverlay(src, duration, nextId))
    },
    [overlays, addOverlay],
  )

  // --- Selected overlay helpers ---

  const selectedOverlay = useMemo(
    () => overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null,
    [overlays, selectedOverlayId],
  )

  const updateSelectedOverlay = useCallback(
    (updates: Partial<Overlay>) => {
      if (selectedOverlayId == null) {
        return
      }
      changeOverlay(selectedOverlayId, (overlay) => ({ ...overlay, ...updates } as Overlay))
    },
    [selectedOverlayId, changeOverlay],
  )

  return {
    // Caption
    captionOverlays,
    addSubtitle,
    updateSubtitle,
    removeSubtitle,
    rebuildSubtitles,

    // Silence cut
    applySilenceCut: applySilenceCutAction,
    removeSilenceCut: removeSilenceCutAction,

    // Media
    addText,
    addImage,
    addAudio,

    // Selected overlay
    selectedOverlay,
    updateSelectedOverlay,
  }
}
