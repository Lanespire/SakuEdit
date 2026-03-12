'use client'

import { create } from 'zustand'
import type { Subtitle } from '@/components/modals'
import type {
  EditorAISuggestion,
  EditorMarker,
  EditorTrackType,
  EditorVideoAsset,
} from '@/lib/editor'
import type { TrackName } from '@/lib/composition-data'
import { sortSubtitles } from '@/lib/editor'

export type EditorTab = 'ai' | 'subtitle' | 'cut' | 'style'

export interface AIChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  createdAt: string
  actionId?: string
}

interface EditorSnapshot {
  subtitles: Subtitle[]
  aiSuggestions: EditorAISuggestion[]
  markers: EditorMarker[]
  playheadSeconds: number
  zoomLevel: number
  scrollPosition: number
  cutApplied: boolean
  playbackRate: number
}

interface HydrateEditorPayload {
  projectName: string
  video: EditorVideoAsset | null
  subtitles: Subtitle[]
  aiSuggestions: EditorAISuggestion[]
  markers: EditorMarker[]
  durationSeconds: number
  playheadSeconds: number
  zoomLevel: number
  scrollPosition: number
  cutApplied: boolean
  chatMessages?: AIChatMessage[]
}

interface EditorUiState {
  activeTab: EditorTab
  isPlaying: boolean
  playbackRate: number
  isSubtitleModalOpen: boolean
  isExportModalOpen: boolean
  selectedSubtitleIndex: number
  selectedSubtitleId: string | null
  selectedTrack: EditorTrackType
  selectedSuggestionId: string | null

  selectedItemId: string | null
  selectedItemTrack: TrackName | null

  undoStack: EditorSnapshot[]
  redoStack: EditorSnapshot[]

  isSaving: boolean
  lastSavedAt: Date | null

  projectName: string
  isEditingName: boolean
  durationSeconds: number
  playheadSeconds: number
  zoomLevel: number
  scrollPosition: number
  cutApplied: boolean
  video: EditorVideoAsset | null
  subtitles: Subtitle[]
  aiSuggestions: EditorAISuggestion[]
  markers: EditorMarker[]
  chatMessages: AIChatMessage[]

  hydrateProject: (payload: HydrateEditorPayload) => void
  setActiveTab: (activeTab: EditorTab) => void
  setIsPlaying: (isPlaying: boolean) => void
  setPlaybackRate: (playbackRate: number) => void
  setDurationSeconds: (durationSeconds: number) => void
  setPlayheadSeconds: (playheadSeconds: number) => void
  setZoomLevel: (zoomLevel: number) => void
  setScrollPosition: (scrollPosition: number) => void
  setCutApplied: (cutApplied: boolean, pushToHistory?: boolean) => void
  setSelectedTrack: (track: EditorTrackType) => void
  setSelectedSuggestionId: (suggestionId: string | null) => void
  setSelectedItem: (itemId: string | null, track: TrackName | null) => void
  selectSubtitleById: (subtitleId: string | null) => void
  openSubtitleModal: (index: number) => void
  closeSubtitleModal: () => void
  openExportModal: () => void
  closeExportModal: () => void

  pushUndo: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  setSaving: (isSaving: boolean) => void
  setLastSavedAt: (date: Date) => void

  setProjectName: (name: string) => void
  setEditingName: (editing: boolean) => void
  replaceSubtitles: (subtitles: Subtitle[], pushToHistory?: boolean) => void
  upsertSubtitle: (subtitle: Subtitle, pushToHistory?: boolean) => void
  deleteSubtitle: (id: string, pushToHistory?: boolean) => void
  replaceAiSuggestions: (suggestions: EditorAISuggestion[], pushToHistory?: boolean) => void
  markSuggestionApplied: (id: string, isApplied: boolean, pushToHistory?: boolean) => void
  replaceMarkers: (markers: EditorMarker[], pushToHistory?: boolean) => void
  setVideo: (video: EditorVideoAsset | null) => void
  replaceChatMessages: (messages: AIChatMessage[]) => void
  appendChatMessage: (message: AIChatMessage) => void
}

const createSnapshot = (state: EditorUiState): EditorSnapshot => ({
  subtitles: state.subtitles,
  aiSuggestions: state.aiSuggestions,
  markers: state.markers,
  playheadSeconds: state.playheadSeconds,
  zoomLevel: state.zoomLevel,
  scrollPosition: state.scrollPosition,
  cutApplied: state.cutApplied,
  playbackRate: state.playbackRate,
})

function withHistoryState(
  state: EditorUiState,
  nextState: Partial<EditorUiState>,
  pushToHistory: boolean,
) {
  if (!pushToHistory) {
    return nextState
  }

  return {
    ...nextState,
    undoStack: [...state.undoStack, createSnapshot(state)],
    redoStack: [],
  }
}

function findSubtitleIndex(subtitles: Subtitle[], subtitleId: string | null) {
  if (!subtitleId) {
    return 0
  }

  return Math.max(
    0,
    subtitles.findIndex((subtitle) => subtitle.id === subtitleId),
  )
}

export const useEditorUiStore = create<EditorUiState>((set, get) => {
  const setWithHistory = (
    updater: (state: EditorUiState) => Partial<EditorUiState>,
    pushToHistory = true,
  ) => {
    set((state) => withHistoryState(state, updater(state), pushToHistory))
  }

  return {
    activeTab: 'ai',
    isPlaying: false,
    playbackRate: 1,
    isSubtitleModalOpen: false,
    isExportModalOpen: false,
    selectedSubtitleIndex: 0,
    selectedSubtitleId: null,
    selectedTrack: 'video',
    selectedSuggestionId: null,

    selectedItemId: null,
    selectedItemTrack: null,

    undoStack: [],
    redoStack: [],

    isSaving: false,
    lastSavedAt: null,

    projectName: '',
    isEditingName: false,
    durationSeconds: 0,
    playheadSeconds: 0,
    zoomLevel: 1,
    scrollPosition: 0,
    cutApplied: false,
    video: null,
    subtitles: [],
    aiSuggestions: [],
    markers: [],
    chatMessages: [],

    hydrateProject: (payload) =>
      set({
        projectName: payload.projectName,
        video: payload.video,
        subtitles: sortSubtitles(payload.subtitles),
        aiSuggestions: payload.aiSuggestions,
        markers: payload.markers,
        durationSeconds: payload.durationSeconds,
        playheadSeconds: payload.playheadSeconds,
        zoomLevel: payload.zoomLevel,
        scrollPosition: payload.scrollPosition,
        cutApplied: payload.cutApplied,
        chatMessages: payload.chatMessages ?? [],
        selectedSubtitleIndex: 0,
        selectedSubtitleId: payload.subtitles[0]?.id ?? null,
        undoStack: [],
        redoStack: [],
      }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds }),
  setPlayheadSeconds: (playheadSeconds) => set({ playheadSeconds }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  setCutApplied: (cutApplied, pushToHistory = true) =>
    setWithHistory(() => ({ cutApplied }), pushToHistory),
  setSelectedTrack: (selectedTrack) => set({ selectedTrack }),
  setSelectedSuggestionId: (selectedSuggestionId) => set({ selectedSuggestionId }),
  setSelectedItem: (selectedItemId, selectedItemTrack) => set({ selectedItemId, selectedItemTrack }),
  selectSubtitleById: (selectedSubtitleId) =>
    set((state) => ({
      selectedSubtitleId,
      selectedSubtitleIndex: findSubtitleIndex(state.subtitles, selectedSubtitleId),
      selectedTrack: selectedSubtitleId ? 'subtitle' : state.selectedTrack,
    })),
  openSubtitleModal: (selectedSubtitleIndex) =>
    set((state) => ({
      selectedSubtitleIndex,
      selectedSubtitleId: state.subtitles[selectedSubtitleIndex]?.id ?? null,
      isSubtitleModalOpen: true,
      activeTab: 'subtitle',
      selectedTrack: 'subtitle',
    })),
  closeSubtitleModal: () => set({ isSubtitleModalOpen: false }),
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),

  pushUndo: () =>
    set((state) => ({
      undoStack: [...state.undoStack, createSnapshot(state)],
      redoStack: [],
    })),

  undo: () =>
    set((state) => {
      const snapshot = state.undoStack.at(-1)
      if (!snapshot) {
        return state
      }

      const undoStack = state.undoStack.slice(0, -1)
      const redoStack = [...state.redoStack, createSnapshot(state)]
      const subtitles = sortSubtitles(snapshot.subtitles)
      const selectedSubtitleId =
        subtitles.find((subtitle) => subtitle.id === state.selectedSubtitleId)?.id ??
        subtitles[0]?.id ??
        null

      return {
        ...state,
        undoStack,
        redoStack,
        subtitles,
        aiSuggestions: snapshot.aiSuggestions,
        markers: snapshot.markers,
        playheadSeconds: snapshot.playheadSeconds,
        zoomLevel: snapshot.zoomLevel,
        scrollPosition: snapshot.scrollPosition,
        cutApplied: snapshot.cutApplied,
        playbackRate: snapshot.playbackRate,
        selectedSubtitleId,
        selectedSubtitleIndex: findSubtitleIndex(subtitles, selectedSubtitleId),
      }
    }),

  redo: () =>
    set((state) => {
      const snapshot = state.redoStack.at(-1)
      if (!snapshot) {
        return state
      }

      const redoStack = state.redoStack.slice(0, -1)
      const undoStack = [...state.undoStack, createSnapshot(state)]
      const subtitles = sortSubtitles(snapshot.subtitles)
      const selectedSubtitleId =
        subtitles.find((subtitle) => subtitle.id === state.selectedSubtitleId)?.id ??
        subtitles[0]?.id ??
        null

      return {
        ...state,
        undoStack,
        redoStack,
        subtitles,
        aiSuggestions: snapshot.aiSuggestions,
        markers: snapshot.markers,
        playheadSeconds: snapshot.playheadSeconds,
        zoomLevel: snapshot.zoomLevel,
        scrollPosition: snapshot.scrollPosition,
        cutApplied: snapshot.cutApplied,
        playbackRate: snapshot.playbackRate,
        selectedSubtitleId,
        selectedSubtitleIndex: findSubtitleIndex(subtitles, selectedSubtitleId),
      }
    }),

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  setSaving: (isSaving) => set({ isSaving }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),

  setProjectName: (projectName) => set({ projectName }),
  setEditingName: (isEditingName) => set({ isEditingName }),
  replaceSubtitles: (subtitles, pushToHistory = true) =>
    setWithHistory((state) => {
      const sorted = sortSubtitles(subtitles)
      const selectedSubtitleId =
        sorted.find((subtitle) => subtitle.id === state.selectedSubtitleId)?.id ??
        sorted[0]?.id ??
        null

      return {
        subtitles: sorted,
        selectedSubtitleId,
        selectedSubtitleIndex: findSubtitleIndex(sorted, selectedSubtitleId),
      }
    }, pushToHistory),
  upsertSubtitle: (subtitle, pushToHistory = true) =>
    setWithHistory((state) => {
      const existingIndex = state.subtitles.findIndex((item) => item.id === subtitle.id)
      const subtitles =
        existingIndex >= 0
          ? state.subtitles.map((item) => (item.id === subtitle.id ? subtitle : item))
          : [...state.subtitles, subtitle]
      const sorted = sortSubtitles(subtitles)

      return {
        subtitles: sorted,
        selectedSubtitleId: subtitle.id,
        selectedSubtitleIndex: findSubtitleIndex(sorted, subtitle.id),
      }
    }, pushToHistory),
  deleteSubtitle: (id, pushToHistory = true) =>
    setWithHistory((state) => {
      const subtitles = state.subtitles.filter((subtitle) => subtitle.id !== id)
      const selectedSubtitleId =
        state.selectedSubtitleId === id
          ? subtitles[Math.max(0, state.selectedSubtitleIndex - 1)]?.id ?? subtitles[0]?.id ?? null
          : state.selectedSubtitleId

      return {
        subtitles,
        selectedSubtitleId,
        selectedSubtitleIndex: findSubtitleIndex(subtitles, selectedSubtitleId),
      }
    }, pushToHistory),
    replaceAiSuggestions: (aiSuggestions, pushToHistory = true) =>
      setWithHistory(() => ({
        aiSuggestions,
      }), pushToHistory),
    markSuggestionApplied: (id, isApplied, pushToHistory = true) =>
      setWithHistory((state) => ({
        aiSuggestions: state.aiSuggestions.map((suggestion) =>
          suggestion.id === id ? { ...suggestion, isApplied } : suggestion,
        ),
        selectedSuggestionId: id,
      }), pushToHistory),
    replaceMarkers: (markers, pushToHistory = true) =>
      setWithHistory(() => ({
        markers,
      }), pushToHistory),
    setVideo: (video) => set({ video }),
    replaceChatMessages: (chatMessages) => set({ chatMessages }),
    appendChatMessage: (message) =>
      set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
  }
})
