'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { SHOW_MOBILE_WARNING } from '@/app/constants'
import { ReactVideoEditor } from '@/app/reactvideoeditor/pro/components/react-video-editor'
import { HttpRenderer } from '@/app/reactvideoeditor/pro/utils/http-renderer'
import { MobileWarningModal } from '@/app/reactvideoeditor/pro/components/shared/mobile-warning-modal'
import ProcessingWorkspace from '@/components/editor/ProcessingWorkspace'
import ProjectEditorSyncBridge from '@/components/rve/ProjectEditorSyncBridge'
import { isProjectErrorStatus, isProjectProcessingStatus } from '@/lib/project-status'
import {
  createProjectEditorState,
  type ProjectEditorSeed,
  type PersistedRveEditorState,
} from '@/lib/rve-state'
import { saveEditorState } from '@/app/reactvideoeditor/pro/utils/general/indexdb-helper'

interface ProjectResponse {
  project: ProjectEditorSeed & {
    id: string
    name: string
    status: string
    progress?: number | null
    progressMessage?: string | null
    lastError?: string | null
    videos: Array<Omit<ProjectEditorSeed['videos'][number], 'previewUrl'> & {
      id: string
      filename: string
      storagePath: string | null
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
    style?: {
      subtitleSettings?: Record<string, unknown> | null
    } | null
    aiSuggestions?: Array<{
      type?: string | null
      isApplied?: boolean | null
    }>
  }
}

interface ProcessingLogEntry {
  id: string
  timestamp: string
  text: string
}

function createProcessingLog(message: string, index: number): ProcessingLogEntry {
  return {
    id: `processing-log-${index}`,
    timestamp: new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    text: message,
  }
}

export default function EditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectResponse['project'] | null>(null)
  const [initialEditorState, setInitialEditorState] = useState<PersistedRveEditorState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreparingEditor, setIsPreparingEditor] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadProject = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('プロジェクトの読み込みに失敗しました')
        }

        const data = (await response.json()) as ProjectResponse
        if (!active) {
          return
        }

        const sourceVideo = data.project.videos[0]
        const nextEditorState = createProjectEditorState({
          compositionData: data.project.compositionData,
          videos: sourceVideo?.storagePath
            ? [{
                duration: sourceVideo.duration,
                previewUrl: `/api/projects/${data.project.id}/source-video`,
                width: sourceVideo.width,
                height: sourceVideo.height,
                silenceDetected: sourceVideo.silenceDetected,
              }]
            : [],
          subtitles: data.project.subtitles,
          style: data.project.style,
          aiSuggestions: data.project.aiSuggestions,
        })

        setProject(data.project)
        setInitialEditorState(nextEditorState)
      } catch (loadError) {
        if (!active) {
          return
        }

        console.error(loadError)
        setError(loadError instanceof Error ? loadError.message : 'エラーが発生しました')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      active = false
    }
  }, [projectId])

  useEffect(() => {
    let active = true

    const seedAutosave = async () => {
      if (!project || !initialEditorState) {
        return
      }

      setIsPreparingEditor(true)
      try {
        await saveEditorState(project.id, initialEditorState)
      } catch (seedError) {
        console.error('failed to seed rve autosave state', seedError)
      } finally {
        if (active) {
          setIsPreparingEditor(false)
        }
      }
    }

    void seedAutosave()

    return () => {
      active = false
    }
  }, [initialEditorState, project])

  const renderer = useMemo(() => new HttpRenderer('/api/latest/ssr', {
    type: 'ssr',
    entryPoint: '/api/latest/ssr',
  }), [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p>プロジェクトを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !project || !initialEditorState) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="max-w-md text-center">
          <h2 className="mb-3 text-2xl font-semibold">エラーが発生しました</h2>
          <p className="mb-6 text-sm text-muted">{error || 'editor の初期化に失敗しました'}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-white"
            >
              再試行
            </button>
            <Link
              href="/projects"
              className="rounded-md border border-border px-4 py-2"
            >
              プロジェクト一覧
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isProcessing = isProjectProcessingStatus(project.status)
  const isPipelineError = isProjectErrorStatus(project.status)

  if (isProcessing || isPipelineError) {
    const logs = [project.lastError, project.progressMessage]
      .filter((message): message is string => Boolean(message))
      .map((message, index) => createProcessingLog(message, index))

    const sourceVideo = project.videos[0]

    return (
      <ProcessingWorkspace
        projectName={project.name}
        status={project.status}
        progress={Math.max(0, Math.min(project.progress ?? 0, 100))}
        progressMessage={project.progressMessage ?? ''}
        lastError={project.lastError ?? null}
        video={sourceVideo ? {
          id: sourceVideo.id,
          storagePath: sourceVideo.storagePath,
          previewUrl: `/api/projects/${project.id}/source-video`,
          filename: sourceVideo.filename,
          duration: sourceVideo.duration,
        } : null}
        logs={logs}
        onReload={() => window.location.reload()}
        onBackToProjects={() => router.push('/projects')}
      />
    )
  }

  return (
    <div className="sakuedit-rve-shell fixed inset-0 bg-background text-foreground">
      <MobileWarningModal show={SHOW_MOBILE_WARNING} />
      {isPreparingEditor ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p>RVE を準備中...</p>
          </div>
        </div>
      ) : (
        <ReactVideoEditor
          projectId={project.id}
          defaultOverlays={initialEditorState.overlays}
          defaultAspectRatio={initialEditorState.aspectRatio}
          defaultBackgroundColor={initialEditorState.backgroundColor}
          baseUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
          fps={30}
          renderer={renderer}
        >
          <ProjectEditorSyncBridge projectId={project.id} />
        </ReactVideoEditor>
      )}
    </div>
  )
}
