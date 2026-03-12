'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import type { Subtitle } from '@/components/modals'
import {
  DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  EDITOR_FPS,
  getDurationInFrames,
  getPlaybackSegments,
  mapTimelineTimeToSourceTime,
  type SilenceRegion,
  type SubtitleDisplaySettings,
} from '@/lib/editor'
import { VideoComposition } from '@/remotion/compositions/VideoComposition'

interface VideoPlayerProps {
  video: {
    id: string
    storagePath: string | null
    previewUrl: string | null
    filename: string
    duration: number
  } | null
  subtitles: Subtitle[]
  styleName?: string
  silenceRegions?: SilenceRegion[]
  cutApplied?: boolean
  subtitleDisplaySettings?: SubtitleDisplaySettings
  playheadSeconds: number
  isPlaying: boolean
  playbackRate?: number
  onTimeUpdate?: (currentTime: number) => void
  onPlayStateChange?: (isPlaying: boolean) => void
  onPlaybackRateChange?: (playbackRate: number) => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideoPlayer({
  video,
  subtitles,
  styleName,
  silenceRegions = [],
  cutApplied = false,
  subtitleDisplaySettings = DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  playheadSeconds,
  isPlaying,
  playbackRate = 1,
  onTimeUpdate,
  onPlayStateChange,
  onPlaybackRateChange,
}: VideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)
  const videoSrc = video?.previewUrl ?? null

  const playbackSegments = useMemo(
    () => getPlaybackSegments(video?.duration ?? 0, silenceRegions, cutApplied),
    [cutApplied, silenceRegions, video?.duration],
  )

  const durationSeconds = playbackSegments.at(-1)?.timelineEnd ?? video?.duration ?? 0
  const durationInFrames = getDurationInFrames(durationSeconds)
  const currentFrame = Math.min(
    durationInFrames - 1,
    Math.max(0, Math.round(playheadSeconds * EDITOR_FPS)),
  )

  const inputProps = useMemo(() => ({
    videoUrl: videoSrc,
    subtitles,
    styleName,
    playbackSegments,
    subtitleDisplaySettings,
  }), [playbackSegments, styleName, subtitleDisplaySettings, subtitles, videoSrc])

  useEffect(() => {
    const player = playerRef.current

    if (!player) {
      return
    }

    const handleFrameUpdate = ({ detail }: { detail: { frame: number } }) => {
      onTimeUpdate?.(detail.frame / EDITOR_FPS)
    }

    const handlePlay = () => onPlayStateChange?.(true)
    const handlePause = () => onPlayStateChange?.(false)
    const handleRateChange = ({ detail }: { detail: { playbackRate: number } }) => {
      onPlaybackRateChange?.(detail.playbackRate)
    }

    player.addEventListener('frameupdate', handleFrameUpdate)
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('ratechange', handleRateChange)

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate)
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('ratechange', handleRateChange)
    }
  }, [onPlaybackRateChange, onPlayStateChange, onTimeUpdate])

  useEffect(() => {
    const player = playerRef.current

    if (!player) {
      return
    }

    if (Math.abs(player.getCurrentFrame() - currentFrame) > 1) {
      player.seekTo(currentFrame)
    }
  }, [currentFrame])

  useEffect(() => {
    const player = playerRef.current

    if (!player) {
      return
    }

    if (isPlaying && !player.isPlaying()) {
      player.play()
      return
    }

    if (!isPlaying && player.isPlaying()) {
      player.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const player = playerRef.current

    if (!player) {
      return
    }

    const currentVolume = player.getVolume()
    if (Math.abs(currentVolume - 1) > 0.01) {
      player.setVolume(1)
    }
  }, [])

  const sourceTime = mapTimelineTimeToSourceTime(playheadSeconds, playbackSegments)

  return (
    <div
      className="w-full max-w-[980px] rounded-[22px] border border-[#403029] bg-[#181311] p-3 shadow-[0_20px_46px_rgba(0,0,0,0.28)] xl:max-w-[1040px]"
      data-test-id="main-preview-player"
    >
      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0f0c0b] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {videoSrc ? (
          <Player
            ref={playerRef}
            component={VideoComposition}
            durationInFrames={durationInFrames}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={EDITOR_FPS}
            controls={false}
            clickToPlay={false}
            spaceKeyToPlayOrPause={false}
            playbackRate={playbackRate}
            initialFrame={currentFrame}
            inputProps={inputProps}
            className="w-full"
            style={{ width: '100%', aspectRatio: '16 / 9' }}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#4a372c] to-[#241b16]">
            <div className="text-center">
              <span className="material-symbols-outlined mb-2 text-5xl text-white/25">
                videocam_off
              </span>
              <p className="text-sm text-white/45">動画が見つかりません</p>
            </div>
          </div>
        )}

        {styleName && (
          <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-[#2c211c]/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {styleName}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-[16px] border border-white/8 bg-[#231a16] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => playerRef.current?.toggle()}
            disabled={!videoSrc}
            className="flex size-11 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
            data-test-id="play-button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="min-w-0 flex-1 basis-[360px]">
            <input
              type="range"
              min={0}
              max={durationSeconds || 0}
              step={0.05}
              value={playheadSeconds}
              onChange={(event) => onTimeUpdate?.(Number(event.target.value))}
              disabled={!videoSrc}
              className="w-full accent-primary"
              data-test-id="seek-bar"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-white/62">
              <span>{formatTime(playheadSeconds)}</span>
              <span>{formatTime(sourceTime)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {[0.75, 1, 1.25].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onPlaybackRateChange?.(rate)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'bg-primary/20 text-[#fff1e3]'
                    : 'bg-white/10 text-white/75 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/42">
          <span className="truncate">{video?.filename ?? 'No video'}</span>
          <span>{cutApplied ? 'cut' : 'raw'}</span>
        </div>
      </div>
    </div>
  )
}
