'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useEditorContext } from '@/app/reactvideoeditor/pro/contexts/editor-context'

interface ProjectEditorSyncBridgeProps {
  projectId: string
}

export default function ProjectEditorSyncBridge({ projectId }: ProjectEditorSyncBridgeProps) {
  const {
    overlays,
    aspectRatio,
    backgroundColor,
    playbackRate,
    currentFrame,
    durationInFrames,
    selectedOverlayId,
    selectedOverlayIds,
    fps,
    isInitialLoadComplete,
  } = useEditorContext()

  const previousPayloadRef = useRef<string>('')

  const payload = useMemo(() => JSON.stringify({
    kind: 'rve-pro',
    version: 1,
    editorState: {
      overlays,
      aspectRatio,
      backgroundColor,
      playbackRate,
      currentFrame,
      durationInFrames,
      selectedOverlayId,
      selectedOverlayIds,
    },
  }), [
    overlays,
    aspectRatio,
    backgroundColor,
    playbackRate,
    currentFrame,
    durationInFrames,
    selectedOverlayId,
    selectedOverlayIds,
  ])

  useEffect(() => {
    if (!projectId || !isInitialLoadComplete) {
      return
    }

    if (payload === previousPayloadRef.current) {
      return
    }

    const controller = new AbortController()
    const timerId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/timeline`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentTime: currentFrame / fps,
            zoomLevel: 1,
            scrollPosition: 0,
            compositionData: payload,
          }),
          signal: controller.signal,
        })

        if (response.ok) {
          previousPayloadRef.current = payload
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('failed to sync rve editor state', error)
        }
      }
    }, 900)

    return () => {
      controller.abort()
      window.clearTimeout(timerId)
    }
  }, [currentFrame, fps, isInitialLoadComplete, payload, projectId])

  return null
}

