'use client'

import { create } from 'zustand'

export type EditorTab = 'ai' | 'subtitle' | 'cut' | 'style'

interface EditorUiState {
  activeTab: EditorTab
  isPlaying: boolean
  isSubtitleModalOpen: boolean
  isExportModalOpen: boolean
  selectedSubtitleIndex: number
  setActiveTab: (activeTab: EditorTab) => void
  setIsPlaying: (isPlaying: boolean) => void
  openSubtitleModal: (index: number) => void
  closeSubtitleModal: () => void
  openExportModal: () => void
  closeExportModal: () => void
}

export const useEditorUiStore = create<EditorUiState>((set) => ({
  activeTab: 'ai',
  isPlaying: false,
  isSubtitleModalOpen: false,
  isExportModalOpen: false,
  selectedSubtitleIndex: 0,
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  openSubtitleModal: (selectedSubtitleIndex) =>
    set({ selectedSubtitleIndex, isSubtitleModalOpen: true }),
  closeSubtitleModal: () => set({ isSubtitleModalOpen: false }),
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
}))
