'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Group, Panel, Separator } from 'react-resizable-panels'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorTimeline from '@/components/editor/EditorTimeline'
import IntegratedEditorPanel from '@/components/editor/IntegratedEditorPanel'
import VideoPlayer from '@/components/editor/VideoPlayer'
import { ExportSettingsModal, SubtitleEditModal, type ExportSettings, type Subtitle } from '@/components/modals'
import {
  buildFallbackSuggestions,
  createHighlightMarkers,
  createNewSubtitle,
  DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  getEditorMediaDurationSeconds,
  getPlaybackSegments,
  getSubtitleDisplaySettings,
  getTimelineDurationSeconds,
  mapSourceTimeToTimelineTime,
  normalizeHighlights,
  normalizeSilenceRegions,
  normalizeWaveform,
  toEditorSubtitle,
  toSubtitleMutationPayload,
  withSuggestionVisuals,
  type EditorMarker,
  type SubtitleDisplaySettings,
  type EditorVideoAsset,
} from '@/lib/editor'
import { useEditorActions } from '@/lib/hooks/useEditorActions'
import { type AIChatMessage, useEditorUiStore } from '@/lib/stores/editor-ui-store'
import type { PlanId } from '@/lib/plans'

interface ProjectResponse {
  project: {
    id: string
    name: string
    status: string
    timeline?: {
      currentTime?: number
      zoomLevel?: number
      scrollPosition?: number
    } | null
    markers?: Array<{
      id: string
      time: number
      type: string
      label?: string | null
      color?: string
    }>
    style?: {
      name: string
      description?: string | null
      category: string
      subtitleSettings?: Record<string, unknown> | null
    } | null
    videos: Array<{
      id: string
      filename: string
      storagePath: string | null
      duration: number
      silenceDetected?: unknown
      waveform?: unknown
      highlights?: unknown
    }>
    subtitles: Array<{
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
    }>
    aiSuggestions: Array<{
      id: string
      type: string
      title: string
      description: string
      data?: Record<string, unknown> | null
      isApplied?: boolean | null
    }>
  }
  billing?: {
    planId: PlanId
    remainingSeconds: number
    usedSeconds: number
  } | null
}

interface BillingData {
  planId: PlanId
  remainingSeconds: number
  usedSeconds: number
}

function createInitialMessages(): AIChatMessage[] {
  return []
}

export default function EditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const pendingNewSubtitleIdRef = useRef<string | null>(null)
  const hasHydratedRef = useRef(false)
  const timelineSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    isSubtitleModalOpen,
    isExportModalOpen,
    selectedSubtitleIndex,
    selectedSubtitleId,
    openSubtitleModal,
    closeSubtitleModal,
    openExportModal,
    closeExportModal,
    isSaving,
    lastSavedAt,
    projectName,
    isEditingName,
    setEditingName,
    undo,
    redo,
    canUndo,
    canRedo,
    subtitles,
    aiSuggestions,
    markers,
    video,
    durationSeconds,
    playheadSeconds,
    zoomLevel,
    scrollPosition,
    cutApplied,
    hydrateProject,
    setPlayheadSeconds,
    setIsPlaying,
    isPlaying,
    playbackRate,
    setPlaybackRate,
    setZoomLevel,
    setScrollPosition,
    upsertSubtitle,
    deleteSubtitle,
    replaceMarkers,
    markSuggestionApplied,
    setCutApplied,
    selectSubtitleById,
    chatMessages,
    appendChatMessage,
    setSaving,
    setLastSavedAt,
  } = useEditorUiStore()

  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [projectStyle, setProjectStyle] = useState<ProjectResponse['project']['style']>(null)
  const [subtitleDisplaySettings, setSubtitleDisplaySettings] = useState<SubtitleDisplaySettings>(
    DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')

  const { saveDraft, updateProjectName, goToProjects } = useEditorActions({
    projectId,
    projectName: projectName || 'プロジェクト',
  })

  const primaryVideo = video
  const playbackSegments = useMemo(
    () => getPlaybackSegments(primaryVideo?.duration ?? durationSeconds, primaryVideo?.silenceRegions ?? [], cutApplied),
    [cutApplied, durationSeconds, primaryVideo?.duration, primaryVideo?.silenceRegions],
  )

  useEffect(() => {
    if (!projectId) {
      return
    }

    const loadProject = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error('プロジェクトの読み込みに失敗しました')
        }

        const data = (await response.json()) as ProjectResponse
        const project = data.project
        const sourceVideo = project.videos[0]
        const normalizedSubtitles = project.subtitles.map((subtitle) => toEditorSubtitle(subtitle))
        const normalizedMarkers: EditorMarker[] = (project.markers ?? []).map((marker) => ({
          id: marker.id,
          time: marker.time,
          type: marker.type,
          label: marker.label ?? null,
          color: marker.color ?? '#f97415',
        }))
        const normalizedSilenceRegions = sourceVideo ? normalizeSilenceRegions(sourceVideo.silenceDetected) : []
        const normalizedWaveform = sourceVideo ? normalizeWaveform(sourceVideo.waveform) : []
        const normalizedHighlights = sourceVideo ? normalizeHighlights(sourceVideo.highlights) : []
        const estimatedDuration = getEditorMediaDurationSeconds(
          sourceVideo?.duration ?? 0,
          normalizedSubtitles,
          normalizedMarkers,
          normalizedHighlights,
          normalizedSilenceRegions,
        )
        const editorVideo: EditorVideoAsset | null = sourceVideo
          ? {
              id: sourceVideo.id,
              filename: sourceVideo.filename,
              storagePath: sourceVideo.storagePath,
              previewUrl: `/api/projects/${projectId}/source-video`,
              duration: estimatedDuration,
              silenceRegions: normalizedSilenceRegions,
              waveform: normalizedWaveform,
              highlights: normalizedHighlights,
            }
          : null

        const normalizedSuggestions = project.aiSuggestions.length > 0
          ? project.aiSuggestions.map((suggestion) =>
              withSuggestionVisuals({
                id: suggestion.id,
                type: suggestion.type,
                title: suggestion.title,
                description: suggestion.description,
                data: suggestion.data,
                isApplied: suggestion.isApplied,
              }),
            )
          : buildFallbackSuggestions(editorVideo)

        const isSilenceSuggestionApplied = normalizedSuggestions.some(
          (suggestion) => suggestion.type === 'silence-cut' && suggestion.isApplied,
        )
        const nextDurationSeconds = getTimelineDurationSeconds(
          estimatedDuration,
          editorVideo?.silenceRegions ?? [],
          isSilenceSuggestionApplied,
        )

        hydrateProject({
          projectName: project.name,
          video: editorVideo,
          subtitles: normalizedSubtitles,
          aiSuggestions: normalizedSuggestions,
          markers: normalizedMarkers,
          durationSeconds: nextDurationSeconds,
          playheadSeconds: Math.min(project.timeline?.currentTime ?? 0, nextDurationSeconds),
          zoomLevel: project.timeline?.zoomLevel ?? 1,
          scrollPosition: project.timeline?.scrollPosition ?? 0,
          cutApplied: isSilenceSuggestionApplied,
          chatMessages: createInitialMessages(),
        })

        setProjectStyle(project.style ?? null)
        setSubtitleDisplaySettings(
          getSubtitleDisplaySettings(
            project.style?.subtitleSettings ?? DEFAULT_SUBTITLE_DISPLAY_SETTINGS,
          ),
        )
        setBillingData(data.billing ?? null)
        hasHydratedRef.current = true
      } catch (loadError) {
        console.error(loadError)
        setError(loadError instanceof Error ? loadError.message : 'エラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProject()
  }, [hydrateProject, projectId])

  useEffect(() => {
    if (!projectId || !hasHydratedRef.current || isLoading) {
      return
    }

    if (timelineSaveTimerRef.current) {
      clearTimeout(timelineSaveTimerRef.current)
    }

    timelineSaveTimerRef.current = setTimeout(() => {
      void fetch(`/api/projects/${projectId}/timeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTime: playheadSeconds,
          zoomLevel,
          scrollPosition,
          isPlaying,
        }),
      }).then((response) => {
        if (response.ok) {
          setLastSavedAt(new Date())
        }
      }).catch((saveError) => {
        console.error('timeline save error', saveError)
      })
    }, 450)

    return () => {
      if (timelineSaveTimerRef.current) {
        clearTimeout(timelineSaveTimerRef.current)
      }
    }
  }, [isLoading, isPlaying, playheadSeconds, projectId, scrollPosition, setLastSavedAt, zoomLevel])

  const lastSavedText = (() => {
    if (isSaving) return '保存中...'
    if (!lastSavedAt) return '未保存'
    const diff = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)
    if (diff < 60) return `${diff}秒前`
    return `${Math.floor(diff / 60)}分前`
  })()

  const currentSubtitle = subtitles[selectedSubtitleIndex] ?? null

  const startEditingName = () => {
    setEditNameValue(projectName || 'プロジェクト')
    setEditingName(true)
  }

  const finishEditingName = () => {
    setEditingName(false)
    const nextName = editNameValue.trim()
    if (nextName && nextName !== projectName) {
      updateProjectName(nextName)
    }
  }

  const persistSuggestionApplied = async (suggestionId: string, isApplied: boolean) => {
    if (suggestionId.startsWith('fallback-')) {
      return
    }

    await fetch(`/api/projects/${projectId}/ai-suggestions/${suggestionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApplied }),
    })
  }

  const persistMarkers = async (nextMarkers: EditorMarker[]) => {
    const response = await fetch(`/api/projects/${projectId}/markers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markers: nextMarkers.map((marker) => ({
          id: marker.id,
          time: marker.time,
          type: marker.type,
          label: marker.label ?? null,
          color: marker.color,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error('マーカーの保存に失敗しました')
    }

    setLastSavedAt(new Date())
  }

  const handleSaveSubtitle = async (subtitle: Subtitle) => {
    setSaving(true)

    try {
      const payload = toSubtitleMutationPayload(subtitle)

      if (subtitle.id.startsWith('new-')) {
        const response = await fetch(`/api/projects/${projectId}/subtitles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('字幕の作成に失敗しました')
        }

        const { subtitle: createdSubtitle } = await response.json()
        deleteSubtitle(subtitle.id, false)
        upsertSubtitle(toEditorSubtitle(createdSubtitle), false)
        pendingNewSubtitleIdRef.current = null
      } else {
        const response = await fetch(`/api/projects/${projectId}/subtitles/${subtitle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('字幕の更新に失敗しました')
        }

        const { subtitle: updatedSubtitle } = await response.json()
        upsertSubtitle(toEditorSubtitle(updatedSubtitle), false)
      }

      closeSubtitleModal()
      setLastSavedAt(new Date())
    } catch (subtitleError) {
      console.error(subtitleError)
      setError(subtitleError instanceof Error ? subtitleError.message : '字幕の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubtitle = async (subtitleId: string) => {
    if (subtitleId.startsWith('new-')) {
      deleteSubtitle(subtitleId, false)
      pendingNewSubtitleIdRef.current = null
      closeSubtitleModal()
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/subtitles/${subtitleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('字幕の削除に失敗しました')
      }

      deleteSubtitle(subtitleId, false)
      closeSubtitleModal()
      setLastSavedAt(new Date())
    } catch (subtitleError) {
      console.error(subtitleError)
      setError(subtitleError instanceof Error ? subtitleError.message : '字幕の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSubtitle = () => {
    const subtitle = createNewSubtitle(playheadSeconds, subtitles.length)
    pendingNewSubtitleIdRef.current = subtitle.id
    upsertSubtitle(subtitle)
    const nextIndex = subtitles.length
    selectSubtitleById(subtitle.id)
    openSubtitleModal(nextIndex)
  }

  const handleCloseSubtitleModal = () => {
    const pendingId = pendingNewSubtitleIdRef.current
    if (pendingId) {
      deleteSubtitle(pendingId, false)
      pendingNewSubtitleIdRef.current = null
    }
    closeSubtitleModal()
  }

  const handleApplyCuts = async (suggestionId?: string) => {
    setCutApplied(true, false)

    if (suggestionId) {
      markSuggestionApplied(suggestionId, true, false)
      await persistSuggestionApplied(suggestionId, true)
    }

    setLastSavedAt(new Date())
  }

  const handleHighlightSuggestion = async (suggestionId?: string) => {
    const fallbackHighlights = subtitles.slice(0, 3).map((subtitle) => subtitle.startTime ?? 0)
    const nextMarkers = createHighlightMarkers(
      primaryVideo?.highlights.length ? primaryVideo.highlights : fallbackHighlights,
    )

    replaceMarkers(nextMarkers, false)
    await persistMarkers(nextMarkers)

    if (nextMarkers[0]) {
      const nextPlayhead = mapSourceTimeToTimelineTime(nextMarkers[0].time, playbackSegments)
      setPlayheadSeconds(nextPlayhead)
    }

    if (suggestionId) {
      markSuggestionApplied(suggestionId, true, false)
      await persistSuggestionApplied(suggestionId, true)
    }
  }

  const handleTempoSuggestion = async (suggestionId?: string) => {
    setPlaybackRate(1.15)

    if (suggestionId) {
      markSuggestionApplied(suggestionId, true, false)
      await persistSuggestionApplied(suggestionId, true)
    }

    setLastSavedAt(new Date())
  }

  const handleJumpToMarker = (index = 0) => {
    const marker = markers[index]
    if (!marker) {
      return
    }

    const nextPlayhead = mapSourceTimeToTimelineTime(marker.time, playbackSegments)
    setPlayheadSeconds(nextPlayhead)
  }

  const handleApplySuggestion = async (suggestionId: string) => {
    const suggestion = aiSuggestions.find((item) => item.id === suggestionId)
    if (!suggestion) {
      return
    }

    try {
      if (suggestion.type === 'silence-cut') {
        await handleApplyCuts(suggestionId)
        return
      }

      if (suggestion.type === 'highlight-detect') {
        await handleHighlightSuggestion(suggestionId)
        return
      }

      if (suggestion.type === 'tempo-optimize') {
        await handleTempoSuggestion(suggestionId)
      }
    } catch (suggestionError) {
      console.error(suggestionError)
      setError(suggestionError instanceof Error ? suggestionError.message : '提案の適用に失敗しました')
    }
  }

  const handlePreviewSuggestion = (suggestionId: string) => {
    const suggestion = aiSuggestions.find((item) => item.id === suggestionId)
    if (!suggestion || !primaryVideo) {
      return
    }

    if (suggestion.type === 'silence-cut' && primaryVideo.silenceRegions[0]) {
      setPlayheadSeconds(
        mapSourceTimeToTimelineTime(primaryVideo.silenceRegions[0].start, playbackSegments),
      )
      return
    }

    if (suggestion.type === 'highlight-detect') {
      const previewTime = primaryVideo.highlights[0] ?? subtitles[0]?.startTime ?? 0
      setPlayheadSeconds(mapSourceTimeToTimelineTime(previewTime, playbackSegments))
      return
    }

    if (suggestion.type === 'tempo-optimize') {
      setPlaybackRate(1.15)
    }
  }

  const handleSendPrompt = (prompt: string) => {
    const createdAt = new Date().toISOString()
    appendChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      createdAt,
    })

    const normalizedPrompt = prompt.toLowerCase()
    const silenceSuggestion = aiSuggestions.find((item) => item.type === 'silence-cut')
    const highlightSuggestion = aiSuggestions.find((item) => item.type === 'highlight-detect')
    const tempoSuggestion = aiSuggestions.find((item) => item.type === 'tempo-optimize')
    const tasks: Array<() => Promise<void> | void> = []
    const shouldCutSilence = normalizedPrompt.includes('無音') || normalizedPrompt.includes('カット')
    const shouldCreateHighlights =
      normalizedPrompt.includes('見どころ') ||
      normalizedPrompt.includes('ハイライト') ||
      normalizedPrompt.includes('マーカー')
    const shouldAdjustTempo =
      (normalizedPrompt.includes('テンポ') || normalizedPrompt.includes('速')) &&
      !normalizedPrompt.includes('等速') &&
      !normalizedPrompt.includes('通常速度')
    const shouldResetPlaybackRate =
      normalizedPrompt.includes('等速') ||
      normalizedPrompt.includes('通常速度') ||
      normalizedPrompt.includes('元の速度')
    const shouldJumpToFirstHighlight =
      (normalizedPrompt.includes('最初') || normalizedPrompt.includes('先頭')) &&
      (normalizedPrompt.includes('見どころ') || normalizedPrompt.includes('マーカー')) &&
      (normalizedPrompt.includes('移動') || normalizedPrompt.includes('ジャンプ'))

    if (shouldCutSilence) {
      tasks.push(() => (silenceSuggestion ? handleApplySuggestion(silenceSuggestion.id) : handleApplyCuts()))
    }

    if (shouldCreateHighlights) {
      tasks.push(() =>
        highlightSuggestion ? handleApplySuggestion(highlightSuggestion.id) : handleHighlightSuggestion(),
      )
    }

    if (shouldAdjustTempo) {
      tasks.push(() => (tempoSuggestion ? handleApplySuggestion(tempoSuggestion.id) : handleTempoSuggestion()))
    }

    if (shouldResetPlaybackRate) {
      tasks.push(() => {
        setPlaybackRate(1)
        setLastSavedAt(new Date())
      })
    }

    if (shouldJumpToFirstHighlight) {
      tasks.push(async () => {
        const nextMarkers =
          markers.length > 0
            ? markers
            : createHighlightMarkers(primaryVideo?.highlights.length ? primaryVideo.highlights : subtitles.map((subtitle) => subtitle.startTime ?? 0))

        if (markers.length === 0) {
          replaceMarkers(nextMarkers, false)
          await persistMarkers(nextMarkers)
        }

        const targetMarker = nextMarkers[0]
        if (targetMarker) {
          setPlayheadSeconds(mapSourceTimeToTimelineTime(targetMarker.time, playbackSegments))
        }
      })
    }

    if (tasks.length === 0) {
      return
    }

    void (async () => {
      for (const task of tasks) {
        await task()
      }
    })()
  }

  const handleExport = async (settings: ExportSettings) => {
    if (!projectId) return

    setIsExporting(true)
    setError('')
    closeExportModal()

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          quality: settings.quality,
          format: settings.format,
          subtitleOption: settings.subtitleOption,
          removeWatermark: settings.removeWatermark,
          exportThumbnail: settings.exportThumbnail,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || '書き出しに失敗しました')
      }

      const data = await res.json()
      if (data.downloadUrl) {
        window.location.href = data.downloadUrl
      }

      if (data.billing) {
        setBillingData((prev) =>
          prev
            ? {
                ...prev,
                remainingSeconds: data.billing.remainingSeconds,
              }
            : prev,
        )
      }
    } catch (exportError) {
      console.error(exportError)
      setError(exportError instanceof Error ? exportError.message : 'エラーが発生しました')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark text-white">
        <div className="text-center">
          <span className="material-symbols-outlined mb-4 animate-spin text-6xl text-primary">sync</span>
          <p className="text-white/70">プロジェクトを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark text-white">
        <div className="max-w-md text-center">
          <span className="material-symbols-outlined mb-4 text-6xl text-red-400">error</span>
          <h2 className="mb-2 text-2xl font-bold">エラーが発生しました</h2>
          <p className="mb-6 text-white/70">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-6 py-2 font-bold hover:bg-primary/90"
            >
              再試行
            </button>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="rounded-lg bg-white/10 px-6 py-2 hover:bg-white/20"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#2a1d17] font-display text-white selection:bg-primary/30">
      <EditorHeader
        projectName={projectName || 'プロジェクト'}
        isEditingName={isEditingName}
        editNameValue={editNameValue}
        isSaving={isSaving}
        isExporting={isExporting}
        lastSavedText={lastSavedText}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={undo}
        onRedo={redo}
        onSaveDraft={saveDraft}
        onOpenExport={openExportModal}
        onGoToProjects={goToProjects}
        onStartEditingName={startEditingName}
        onNameValueChange={setEditNameValue}
        onFinishEditingName={finishEditingName}
        onCancelEditingName={() => setEditingName(false)}
      />

      <main className="flex-1 overflow-hidden bg-[#1a1411]">
        <Group orientation="vertical">
          <Panel defaultSize={40} minSize={26}>
            <div className="h-full overflow-auto bg-[#1a1411] px-2 pb-2 pt-2">
              <div className="flex h-full min-h-[320px] flex-col gap-2 xl:flex-row">
                <section className="flex min-h-[280px] flex-1 items-center justify-center rounded-[24px] border border-[#3f2d24] bg-[radial-gradient(circle_at_top,_rgba(249,116,21,0.08),_transparent_28%),linear-gradient(180deg,#26201d_0%,#171210_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:p-4">
                  <VideoPlayer
                    video={primaryVideo ? {
                      id: primaryVideo.id,
                      storagePath: primaryVideo.storagePath,
                      previewUrl: primaryVideo.previewUrl,
                      filename: primaryVideo.filename,
                      duration: primaryVideo.duration,
                    } : null}
                    subtitles={subtitles}
                    styleName={projectStyle?.name ?? undefined}
                    silenceRegions={primaryVideo?.silenceRegions ?? []}
                    cutApplied={cutApplied}
                    subtitleDisplaySettings={subtitleDisplaySettings}
                    playheadSeconds={playheadSeconds}
                    isPlaying={isPlaying}
                    playbackRate={playbackRate}
                    onTimeUpdate={setPlayheadSeconds}
                    onPlayStateChange={setIsPlaying}
                    onPlaybackRateChange={setPlaybackRate}
                  />
                </section>

                <div className="min-h-[280px] xl:w-[300px] xl:min-w-[300px]">
                  <IntegratedEditorPanel
                    subtitles={subtitles}
                    markers={markers}
                    suggestions={aiSuggestions}
                    messages={chatMessages}
                    selectedSubtitleId={selectedSubtitleId}
                    playheadSeconds={playheadSeconds}
                    zoomLevel={zoomLevel}
                    cutApplied={cutApplied}
                    styleName={projectStyle?.name ?? undefined}
                    subtitleDisplayMode={subtitleDisplaySettings.mode}
                    subtitleIntervalSeconds={subtitleDisplaySettings.intervalSeconds}
                    playbackRate={playbackRate}
                    onSendPrompt={handleSendPrompt}
                    onApplySuggestion={(id) => {
                      void handleApplySuggestion(id)
                    }}
                    onPreviewSuggestion={handlePreviewSuggestion}
                    onZoomChange={setZoomLevel}
                    onSelectSubtitle={(index) => {
                      selectSubtitleById(subtitles[index]?.id ?? null)
                    }}
                    onEditSubtitle={(index) => {
                      selectSubtitleById(subtitles[index]?.id ?? null)
                      openSubtitleModal(index)
                    }}
                    onJumpToMarker={handleJumpToMarker}
                    onResetPlaybackRate={() => setPlaybackRate(1)}
                    onAddSubtitle={handleAddSubtitle}
                    onOpenStyle={() => router.push(`/styles?projectId=${projectId}`)}
                    onSubtitleDisplayModeChange={(mode) =>
                      setSubtitleDisplaySettings((current) => ({ ...current, mode }))
                    }
                    onSubtitleIntervalSecondsChange={(seconds) =>
                      setSubtitleDisplaySettings((current) => ({ ...current, intervalSeconds: seconds }))
                    }
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Separator className="flex h-1 cursor-row-resize items-center justify-center bg-[#3a291f] transition-colors hover:bg-primary/55">
            <div className="h-0.5 w-8 rounded-full bg-white/30 transition-colors group-hover:bg-white/60" />
          </Separator>

          <Panel defaultSize={60} minSize={42}>
            <div className="h-full overflow-hidden bg-[#14100e] px-2 pb-2 pt-2">
              <div className="h-full overflow-hidden rounded-[24px] border border-[#3a291f] shadow-[0_18px_42px_rgba(0,0,0,0.2)]">
                <EditorTimeline
                  video={primaryVideo}
                  subtitles={subtitles}
                  markers={markers}
                  selectedSubtitleId={selectedSubtitleId}
                  durationSeconds={durationSeconds}
                  playheadSeconds={playheadSeconds}
                  zoomLevel={zoomLevel}
                  scrollPosition={scrollPosition}
                  cutApplied={cutApplied}
                  onPlayheadChange={setPlayheadSeconds}
                  onZoomChange={setZoomLevel}
                  onScrollPositionChange={setScrollPosition}
                  onSelectSubtitle={(index) => {
                    selectSubtitleById(subtitles[index]?.id ?? null)
                  }}
                  onEditSubtitle={(index) => {
                    selectSubtitleById(subtitles[index]?.id ?? null)
                    openSubtitleModal(index)
                  }}
                />
              </div>
            </div>
          </Panel>
        </Group>
      </main>

      {isSubtitleModalOpen && currentSubtitle ? (
        <SubtitleEditModal
          subtitle={currentSubtitle}
          currentIndex={selectedSubtitleIndex}
          totalCount={subtitles.length}
          onClose={handleCloseSubtitleModal}
          onSave={(subtitle) => {
            void handleSaveSubtitle(subtitle)
          }}
          onDelete={(subtitleId) => {
            void handleDeleteSubtitle(subtitleId)
          }}
          onPrev={() => openSubtitleModal(Math.max(0, selectedSubtitleIndex - 1))}
          onNext={() => openSubtitleModal(Math.min(subtitles.length - 1, selectedSubtitleIndex + 1))}
        />
      ) : null}

      {isExportModalOpen ? (
        <ExportSettingsModal
          onClose={closeExportModal}
          onExport={(settings) => {
            void handleExport(settings)
          }}
          planId={billingData?.planId ?? 'free'}
        />
      ) : null}
    </div>
  )
}
