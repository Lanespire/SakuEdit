/**
 * CompositionData - 全編集要素を表現するZodスキーマ型システム
 *
 * アーキテクチャ:
 *   DB (compositionData JSON) → Zustand (CompositionData) → Remotion (レンダリング)
 *   AIチャットもUIもZustand storeのCompositionDataを読み書き
 */

import { z } from 'zod'
import { EDITOR_FPS, getPlaybackSegments, type PlaybackSegment, type SilenceRegion } from './editor'
import type { Subtitle } from '@/components/modals'

// ============================================
// Track Name
// ============================================
export type TrackName = 'videoTrack' | 'audioTracks' | 'subtitleTrack' | 'effectTrack' | 'overlayTrack' | 'captionTrack'

// ============================================
// Meta
// ============================================
export const CompositionMetaSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(EDITOR_FPS),
  durationSeconds: z.number().nonnegative(),
  backgroundColor: z.string().default('#000'),
})

export type CompositionMeta = z.infer<typeof CompositionMetaSchema>

// ============================================
// PlaybackSegment (reuse from editor.ts)
// ============================================
export const PlaybackSegmentSchema = z.object({
  id: z.string(),
  sourceStart: z.number(),
  sourceEnd: z.number(),
  duration: z.number(),
  timelineStart: z.number(),
  timelineEnd: z.number(),
})

// ============================================
// Video Track
// ============================================
export const VideoTrackItemSchema = z.object({
  id: z.string(),
  sourceUrl: z.string(),
  playbackSegments: z.array(PlaybackSegmentSchema).default([]),
  volume: z.number().min(0).max(2).default(1),
  opacity: z.number().min(0).max(1).default(1),
  playbackRate: z.number().positive().default(1),
  startTime: z.number().nonnegative().default(0),
  endTime: z.number().nonnegative().optional(),
  fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  transparency: z.boolean().default(false),
  loop: z.boolean().default(false),
})

export type VideoTrackItem = z.infer<typeof VideoTrackItemSchema>

// ============================================
// Audio Track
// ============================================
export const AudioTrackItemSchema = z.object({
  id: z.string(),
  sourceUrl: z.string().optional(),
  category: z.enum(['bgm', 'se', 'voiceover', 'sfx-builtin']).default('se'),
  volume: z.number().min(0).max(2).default(1),
  startTime: z.number().nonnegative().default(0),
  endTime: z.number().nonnegative().optional(),
  fadeInSeconds: z.number().nonnegative().default(0),
  fadeOutSeconds: z.number().nonnegative().default(0),
  loop: z.boolean().default(false),
  playbackRate: z.number().positive().default(1),
  pitch: z.number().default(0),
  sfxType: z.enum([
    'whoosh', 'whip', 'pageTurn', 'uiSwitch', 'mouseClick',
    'shutterModern', 'shutterOld', 'ding', 'bruh', 'vineBoom', 'windowsXpError',
  ]).optional(),
})

export type AudioTrackItem = z.infer<typeof AudioTrackItemSchema>

// ============================================
// Subtitle Track
// ============================================
export const SubtitleItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  position: z.enum(['top', 'center', 'bottom']).default('bottom'),
  fontSize: z.number().positive().default(24),
  fontColor: z.string().default('#FFFFFF'),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().default('Noto Sans JP, sans-serif'),
  isBold: z.boolean().default(false),
  isItalic: z.boolean().default(false),
  animation: z.enum(['fade', 'spring', 'typewriter', 'word-highlight', 'none']).default('fade'),
  displayMode: z.enum(['word-level', 'sentence', 'tiktok-paging']).default('sentence'),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().nonnegative().optional(),
})

export type SubtitleItem = z.infer<typeof SubtitleItemSchema>

// ============================================
// Effect Track
// ============================================
export const EffectTypeSchema = z.enum([
  'particle',
  'light-leak',
  'camera-motion-blur',
  'trail',
  'transition-fade',
  'transition-slide',
  'transition-wipe',
  'transition-flip',
  'transition-clock-wipe',
  'noise-gradient',
  'audio-visualizer',
  'path-animation',
])

export type EffectType = z.infer<typeof EffectTypeSchema>

export const EffectItemSchema = z.object({
  id: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  effectType: EffectTypeSchema,
  config: z.record(z.string(), z.unknown()).default({}),
})

export type EffectItem = z.infer<typeof EffectItemSchema>

// ============================================
// Overlay Track
// ============================================
export const OverlayTypeSchema = z.enum([
  'text', 'image', 'lottie', 'gif', 'rive', 'shape',
  'rounded-text-box', 'chart', '3d-scene', 'skia-canvas', 'map',
])

export type OverlayType = z.infer<typeof OverlayTypeSchema>

export const ShapeTypeSchema = z.enum([
  'rect', 'circle', 'triangle', 'star', 'ellipse', 'pie', 'arrow', 'heart', 'polygon',
])

export type ShapeType = z.infer<typeof ShapeTypeSchema>

export const OverlayAnimationSchema = z.object({
  type: z.enum(['fade-in', 'slide-in', 'scale-in', 'spring', 'none']).default('none'),
  easing: z.string().optional(),
  durationFrames: z.number().int().positive().optional(),
})

export const OverlayItemSchema = z.object({
  id: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  layer: z.number().int().nonnegative().default(0),
  position: z.object({
    x: z.number().default(50),
    y: z.number().default(50),
  }).default({ x: 50, y: 50 }),
  size: z.object({
    width: z.number().positive().default(200),
    height: z.number().positive().default(200),
  }).default({ width: 200, height: 200 }),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  animation: OverlayAnimationSchema.default({ type: 'none' }),
  overlayType: OverlayTypeSchema,
  overlayConfig: z.record(z.string(), z.unknown()).default({}),
})

export type OverlayItem = z.infer<typeof OverlayItemSchema>

// ============================================
// Caption Track (TikTok-style word-level)
// ============================================
export const CaptionTokenSchema = z.object({
  text: z.string(),
  fromMs: z.number().nonnegative(),
  toMs: z.number().nonnegative(),
})

export const CaptionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
  tokens: z.array(CaptionTokenSchema).optional(),
  displayStyle: z.enum(['highlighted-word', 'karaoke', 'bounce']).default('highlighted-word'),
})

export type CaptionItem = z.infer<typeof CaptionItemSchema>

// ============================================
// CompositionData (root)
// ============================================
export const CompositionDataSchema = z.object({
  meta: CompositionMetaSchema,
  videoTrack: z.array(VideoTrackItemSchema).default([]),
  audioTracks: z.array(AudioTrackItemSchema).default([]),
  subtitleTrack: z.array(SubtitleItemSchema).default([]),
  effectTrack: z.array(EffectItemSchema).default([]),
  overlayTrack: z.array(OverlayItemSchema).default([]),
  captionTrack: z.array(CaptionItemSchema).default([]),
})

export type CompositionData = z.infer<typeof CompositionDataSchema>

// ============================================
// Any track item (union)
// ============================================
export type TrackItem =
  | VideoTrackItem
  | AudioTrackItem
  | SubtitleItem
  | EffectItem
  | OverlayItem
  | CaptionItem

// ============================================
// CompositionPatch
// ============================================
export type CompositionPatch =
  | { op: 'add_item'; track: TrackName; item: Record<string, unknown>; index?: number }
  | { op: 'remove_item'; track: TrackName; itemId: string }
  | { op: 'update_item'; track: TrackName; itemId: string; fields: Record<string, unknown> }
  | { op: 'update_meta'; fields: Partial<CompositionMeta> }
  | { op: 'reorder_items'; track: TrackName; itemIds: string[] }
  | { op: 'duplicate_item'; track: TrackName; itemId: string; newId: string }

// ============================================
// Validation
// ============================================
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateCompositionData(data: unknown): ValidationResult {
  const result = CompositionDataSchema.safeParse(data)
  if (result.success) {
    return { valid: true, errors: [] }
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    ),
  }
}

// ============================================
// Patch application
// ============================================
function getTrackArray(data: CompositionData, track: TrackName): Array<{ id: string } & Record<string, unknown>> {
  return data[track] as Array<{ id: string } & Record<string, unknown>>
}

function setTrackArray(data: CompositionData, track: TrackName, items: unknown[]): CompositionData {
  return { ...data, [track]: items }
}

export function applyPatches(data: CompositionData, patches: CompositionPatch[]): CompositionData {
  let result = { ...data }

  for (const patch of patches) {
    switch (patch.op) {
      case 'add_item': {
        const items = [...getTrackArray(result, patch.track)]
        const index = patch.index ?? items.length
        items.splice(index, 0, patch.item as { id: string } & Record<string, unknown>)
        result = setTrackArray(result, patch.track, items)
        break
      }

      case 'remove_item': {
        const items = getTrackArray(result, patch.track).filter(
          (item) => item.id !== patch.itemId,
        )
        result = setTrackArray(result, patch.track, items)
        break
      }

      case 'update_item': {
        const items = getTrackArray(result, patch.track).map((item) =>
          item.id === patch.itemId ? { ...item, ...patch.fields } : item,
        )
        result = setTrackArray(result, patch.track, items)
        break
      }

      case 'update_meta': {
        result = { ...result, meta: { ...result.meta, ...patch.fields } }
        break
      }

      case 'reorder_items': {
        const currentItems = getTrackArray(result, patch.track)
        const itemMap = new Map(currentItems.map((item) => [item.id, item]))
        const reordered = patch.itemIds
          .map((id) => itemMap.get(id))
          .filter((item): item is NonNullable<typeof item> => item != null)
        // Append any items not in the reorder list
        for (const item of currentItems) {
          if (!patch.itemIds.includes(item.id)) {
            reordered.push(item)
          }
        }
        result = setTrackArray(result, patch.track, reordered)
        break
      }

      case 'duplicate_item': {
        const sourceItems = getTrackArray(result, patch.track)
        const sourceItem = sourceItems.find((item) => item.id === patch.itemId)
        if (sourceItem) {
          const duplicate = { ...sourceItem, id: patch.newId }
          const sourceIndex = sourceItems.indexOf(sourceItem)
          const items = [...sourceItems]
          items.splice(sourceIndex + 1, 0, duplicate)
          result = setTrackArray(result, patch.track, items)
        }
        break
      }
    }
  }

  return result
}

// ============================================
// Default factory
// ============================================
export function createEmptyCompositionData(durationSeconds: number): CompositionData {
  return {
    meta: {
      width: 1920,
      height: 1080,
      fps: EDITOR_FPS,
      durationSeconds,
      backgroundColor: '#000',
    },
    videoTrack: [],
    audioTracks: [],
    subtitleTrack: [],
    effectTrack: [],
    overlayTrack: [],
    captionTrack: [],
  }
}

// ============================================
// Legacy conversion: editor-ui-store → CompositionData
// ============================================
interface LegacyEditorData {
  video: {
    id: string
    previewUrl: string | null
    storagePath: string | null
    duration: number
    silenceRegions: SilenceRegion[]
  } | null
  subtitles: Subtitle[]
  cutApplied: boolean
  durationSeconds: number
}

function subtitlePositionToComposition(pos: string | undefined): 'top' | 'center' | 'bottom' {
  switch (pos) {
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

function compositionPositionToLegacy(pos: string | undefined): string {
  switch (pos) {
    case 'top':
      return 'top-center'
    case 'center':
      return 'center'
    default:
      return 'bottom-center'
  }
}

export function compositionDataFromLegacy(legacy: LegacyEditorData): CompositionData {
  const durationSeconds = legacy.durationSeconds || legacy.video?.duration || 10

  const videoTrack: VideoTrackItem[] = []
  if (legacy.video) {
    const sourceUrl = legacy.video.previewUrl || legacy.video.storagePath || ''
    const segments = getPlaybackSegments(
      legacy.video.duration,
      legacy.video.silenceRegions,
      legacy.cutApplied,
    )

    videoTrack.push({
      id: legacy.video.id,
      sourceUrl,
      playbackSegments: segments,
      volume: 1,
      opacity: 1,
      playbackRate: 1,
      startTime: 0,
      endTime: durationSeconds,
      fit: 'cover',
      transparency: false,
      loop: false,
    })
  }

  const subtitleTrack: SubtitleItem[] = legacy.subtitles.map((sub) => ({
    id: sub.id,
    text: sub.text,
    startTime: sub.startTime ?? 0,
    endTime: sub.endTime ?? (sub.startTime ?? 0) + 1,
    position: subtitlePositionToComposition(sub.position),
    fontSize: sub.fontSize ?? 24,
    fontColor: sub.fontColor ?? '#FFFFFF',
    backgroundColor: sub.backgroundColor ?? undefined,
    fontFamily: 'Noto Sans JP, sans-serif',
    isBold: Boolean(sub.isBold),
    isItalic: false,
    animation: 'fade' as const,
    displayMode: 'sentence' as const,
  }))

  return {
    meta: {
      width: 1920,
      height: 1080,
      fps: EDITOR_FPS,
      durationSeconds,
      backgroundColor: '#000',
    },
    videoTrack,
    audioTracks: [],
    subtitleTrack,
    effectTrack: [],
    overlayTrack: [],
    captionTrack: [],
  }
}

// ============================================
// Legacy conversion: CompositionData → editor-ui-store (backward compat)
// ============================================
export function compositionDataToLegacy(data: CompositionData): {
  subtitles: Subtitle[]
  playbackSegments: PlaybackSegment[]
  durationSeconds: number
} {
  const subtitles: Subtitle[] = data.subtitleTrack.map((sub) => ({
    id: sub.id,
    text: sub.text,
    startTime: sub.startTime,
    endTime: sub.endTime,
    start: Math.round(sub.startTime * 1000),
    end: Math.round(sub.endTime * 1000),
    style: 'default',
    position: compositionPositionToLegacy(sub.position),
    fontSize: sub.fontSize,
    fontColor: sub.fontColor,
    backgroundColor: sub.backgroundColor ?? '#00000080',
    isBold: sub.isBold,
    highlight: false,
    width: `${Math.min(360, Math.max(96, sub.text.length * 16 + 48))}px`,
  }))

  const firstVideo = data.videoTrack[0]
  const playbackSegments: PlaybackSegment[] = firstVideo?.playbackSegments.length
    ? firstVideo.playbackSegments
    : [{
        id: 'segment-full',
        sourceStart: 0,
        sourceEnd: data.meta.durationSeconds,
        duration: data.meta.durationSeconds,
        timelineStart: 0,
        timelineEnd: data.meta.durationSeconds,
      }]

  return {
    subtitles,
    playbackSegments,
    durationSeconds: data.meta.durationSeconds,
  }
}

// ============================================
// ID generation
// ============================================
export function generateItemId(prefix = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
