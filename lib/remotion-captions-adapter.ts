import {
  CaptionsInternals,
  createTikTokStyleCaptions,
  parseSrt,
  serializeSrt,
  type Caption,
} from '@remotion/captions'

export interface TimedTextSegment {
  start: number
  end: number
  text: string
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

export function segmentsToCaptions(
  segments: TimedTextSegment[],
): Caption[] {
  return segments
    .map((segment) => ({
      text: normalizeText(segment.text),
      startMs: Math.round(segment.start * 1000),
      endMs: Math.round(segment.end * 1000),
      timestampMs: Math.round(segment.start * 1000),
      confidence: null,
    }))
    .filter((caption) => caption.text.length > 0 && caption.endMs > caption.startMs)
}

export function captionsToSegments(captions: Caption[]): TimedTextSegment[] {
  return captions
    .map((caption) => ({
      start: caption.startMs / 1000,
      end: caption.endMs / 1000,
      text: normalizeText(caption.text),
    }))
    .filter((segment) => segment.text.length > 0 && segment.end > segment.start)
}

export function serializeSegmentsToSrt(segments: TimedTextSegment[]): string {
  const captions = segmentsToCaptions(segments)
  return serializeSrt({
    lines: captions.map((caption) => [caption]),
  })
}

export function parseSrtToSegments(input: string): TimedTextSegment[] {
  return captionsToSegments(parseSrt({ input }).captions)
}

export function shapeCaptionSegments(
  segments: TimedTextSegment[],
  options?: {
    combineTokensWithinMilliseconds?: number
    maxCharsPerLine?: number
  },
): TimedTextSegment[] {
  const captions = segmentsToCaptions(segments)
  if (captions.length === 0) {
    return []
  }

  const pages = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds:
      options?.combineTokensWithinMilliseconds ?? 1200,
  }).pages

  const pageCaptions: Caption[] = pages.map((page) => ({
    text: page.text,
    startMs: page.startMs,
    endMs: page.startMs + page.durationMs,
    timestampMs: page.startMs,
    confidence: null,
  }))

  const reshaped = options?.maxCharsPerLine
    ? CaptionsInternals.ensureMaxCharactersPerLine({
        captions: pageCaptions,
        maxCharsPerLine: options.maxCharsPerLine,
      }).segments.flat()
    : pageCaptions

  return captionsToSegments(reshaped)
}
