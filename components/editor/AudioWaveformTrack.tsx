'use client'

import { useEffect, useMemo, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface AudioWaveformTrackProps {
  audioUrl: string | null
  waveform: number[]
  durationSeconds: number
  widthPx: number
  playheadSeconds: number
  onSeek: (seconds: number) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function AudioWaveformTrack({
  audioUrl,
  waveform,
  durationSeconds,
  widthPx,
  playheadSeconds,
  onSeek,
}: AudioWaveformTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const normalizedPeaks = useMemo(
    () => (waveform.length > 0 ? waveform.map((value) => clamp(value, 0, 1)) : [0.1, 0.22, 0.38, 0.2, 0.15]),
    [waveform],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const wavesurfer = WaveSurfer.create({
      container,
      width: `${widthPx}px`,
      height: 38,
      waveColor: '#a7f3d0',
      progressColor: '#34d399',
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 999,
      barMinHeight: 2,
      fillParent: false,
      normalize: false,
      interact: true,
      dragToSeek: true,
      peaks: [normalizedPeaks],
      duration: durationSeconds,
      url: audioUrl ?? undefined,
      backend: 'MediaElement',
    })

    wavesurfer.on('interaction', (time) => {
      onSeek(clamp(time, 0, durationSeconds))
    })

    wavesurferRef.current = wavesurfer

    return () => {
      wavesurfer.destroy()
      wavesurferRef.current = null
    }
  }, [audioUrl, durationSeconds, normalizedPeaks, onSeek, widthPx])

  useEffect(() => {
    const wavesurfer = wavesurferRef.current
    if (!wavesurfer) {
      return
    }

    if (Math.abs(wavesurfer.getCurrentTime() - playheadSeconds) > 0.05) {
      wavesurfer.setTime(clamp(playheadSeconds, 0, durationSeconds))
    }
  }, [durationSeconds, playheadSeconds])

  return <div ref={containerRef} className="h-[38px]" />
}
