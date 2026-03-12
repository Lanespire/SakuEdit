'use client'

import { create } from 'zustand'
import type { CompositionData, CompositionPatch, TrackName } from '@/lib/composition-data'
import { applyPatches, compositionDataFromLegacy, createEmptyCompositionData } from '@/lib/composition-data'

const MAX_UNDO_STACK = 50

interface CompositionStoreState {
  compositionData: CompositionData
  undoStack: CompositionData[]
  redoStack: CompositionData[]
  isDirty: boolean

  // Hydration
  hydrateFromServer: (jsonString: string) => void
  hydrateFromLegacy: (legacy: {
    video: {
      id: string
      previewUrl: string | null
      storagePath: string | null
      duration: number
      silenceRegions: Array<{ start: number; end: number }>
    } | null
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
    cutApplied: boolean
    durationSeconds: number
  }) => void
  hydrateFromData: (data: CompositionData) => void
  reset: () => void

  // Patch operations (auto-push to undo history)
  applyPatches: (patches: CompositionPatch[]) => void
  applyPatchesNoHistory: (patches: CompositionPatch[]) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Convenience
  getTrackItems: (track: TrackName) => unknown[]
  getItemById: (track: TrackName, id: string) => unknown | undefined
  toJSON: () => string

  // Sync
  markClean: () => void
}

const initialData = createEmptyCompositionData(0)

export const useCompositionStore = create<CompositionStoreState>((set, get) => ({
  compositionData: initialData,
  undoStack: [],
  redoStack: [],
  isDirty: false,

  hydrateFromServer: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as CompositionData
      set({
        compositionData: parsed,
        undoStack: [],
        redoStack: [],
        isDirty: false,
      })
    } catch {
      console.error('Failed to parse compositionData JSON')
    }
  },

  hydrateFromLegacy: (legacy) => {
    const data = compositionDataFromLegacy({
      video: legacy.video
        ? {
            id: legacy.video.id,
            previewUrl: legacy.video.previewUrl,
            storagePath: legacy.video.storagePath,
            duration: legacy.video.duration,
            silenceRegions: legacy.video.silenceRegions,
          }
        : null,
      subtitles: legacy.subtitles.map((s) => ({
        id: s.id,
        text: s.text,
        startTime: s.startTime ?? undefined,
        endTime: s.endTime ?? undefined,
        style: s.style ?? undefined,
        position: s.position ?? undefined,
        fontSize: s.fontSize ?? undefined,
        fontColor: s.fontColor ?? undefined,
        backgroundColor: s.backgroundColor ?? undefined,
        isBold: s.isBold ?? undefined,
        highlight: false,
        width: '96px',
        start: Math.round((s.startTime ?? 0) * 1000),
        end: Math.round((s.endTime ?? 0) * 1000),
      })),
      cutApplied: legacy.cutApplied,
      durationSeconds: legacy.durationSeconds,
    })
    set({
      compositionData: data,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    })
  },

  hydrateFromData: (data: CompositionData) => {
    set({
      compositionData: data,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    })
  },

  reset: () => {
    set({
      compositionData: initialData,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    })
  },

  applyPatches: (patches: CompositionPatch[]) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, state.compositionData].slice(-MAX_UNDO_STACK)
      return {
        compositionData: applyPatches(state.compositionData, patches),
        undoStack: newUndoStack,
        redoStack: [],
        isDirty: true,
      }
    })
  },

  applyPatchesNoHistory: (patches: CompositionPatch[]) => {
    set((state) => ({
      compositionData: applyPatches(state.compositionData, patches),
      isDirty: true,
    }))
  },

  undo: () => {
    set((state) => {
      const snapshot = state.undoStack.at(-1)
      if (!snapshot) return state
      return {
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.compositionData],
        compositionData: snapshot,
        isDirty: true,
      }
    })
  },

  redo: () => {
    set((state) => {
      const snapshot = state.redoStack.at(-1)
      if (!snapshot) return state
      return {
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.compositionData],
        compositionData: snapshot,
        isDirty: true,
      }
    })
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  getTrackItems: (track: TrackName) => {
    return get().compositionData[track] as unknown[]
  },

  getItemById: (track: TrackName, id: string) => {
    const items = get().compositionData[track] as Array<{ id: string }>
    return items.find((item) => item.id === id)
  },

  toJSON: () => JSON.stringify(get().compositionData),

  markClean: () => set({ isDirty: false }),
}))
