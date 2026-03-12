'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorUiStore } from '@/lib/stores/editor-ui-store'

interface UseEditorActionsProps {
  projectId: string
  projectName: string
}

const AUTO_SAVE_INTERVAL_MS = 30_000

export function useEditorActions({ projectId, projectName }: UseEditorActionsProps) {
  const router = useRouter()
  const store = useEditorUiStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // プロジェクト名をstoreに同期
  useEffect(() => {
    store.setProjectName(projectName)
  }, [projectName])

  const saveDraft = useCallback(async () => {
    store.setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      })
      if (res.ok) {
        store.setLastSavedAt(new Date())
      }
    } finally {
      store.setSaving(false)
    }
  }, [projectId])

  const updateProjectName = useCallback(async (newName: string) => {
    store.setProjectName(newName)
    store.setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (res.ok) {
        store.setLastSavedAt(new Date())
      }
    } finally {
      store.setSaving(false)
    }
  }, [projectId])

  const goToProjects = useCallback(() => {
    router.push('/home')
  }, [router])

  // 自動保存（30秒ごと）
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      saveDraft()
    }, AUTO_SAVE_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [saveDraft])

  return { saveDraft, updateProjectName, goToProjects }
}
