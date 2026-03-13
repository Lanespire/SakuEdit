'use client'

import { create } from 'zustand'
import type { ThumbnailMode } from '@/lib/ai-thumbnail'
import type { ThumbnailTemplate } from '@/lib/thumbnail-templates'

// ============================================
// 型定義
// ============================================

export interface GeneratedThumbnailItem {
  id: string
  imageUrl: string
  width: number
  height: number
}

export interface ThumbnailOptions {
  aspectRatio: '16:9' | '4:3'
  textPosition: 'left' | 'center' | 'right'
  colorScheme: string
  count: number
}

export interface ExtractedFrame {
  timestamp: number
  imageUrl: string
  base64: string
}

interface ThumbnailStoreState {
  // モーダル開閉
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void

  // 生成状態
  isGenerating: boolean
  generationError: string | null

  // 生成モード・入力
  generationMode: ThumbnailMode
  setGenerationMode: (mode: ThumbnailMode) => void

  // プロンプト
  prompt: string
  setPrompt: (prompt: string) => void

  // オプション
  options: ThumbnailOptions
  setOptions: (options: Partial<ThumbnailOptions>) => void

  // テンプレート選択
  selectedTemplateId: string | null
  setSelectedTemplateId: (id: string | null) => void

  // アップロード画像（base64）
  uploadedImages: string[]
  addUploadedImage: (base64: string) => void
  removeUploadedImage: (index: number) => void
  clearUploadedImages: () => void

  // 動画フレーム
  extractedFrames: ExtractedFrame[]
  selectedFrameTimestamps: number[]
  setExtractedFrames: (frames: ExtractedFrame[]) => void
  toggleFrameTimestamp: (timestamp: number) => void
  clearFrames: () => void

  // 参考入力
  referenceUrl: string
  setReferenceUrl: (url: string) => void
  referenceImages: string[]
  addReferenceImage: (base64: string) => void
  removeReferenceImage: (index: number) => void
  clearReferenceImages: () => void

  // 生成結果
  generatedThumbnails: GeneratedThumbnailItem[]
  selectedThumbnailId: string | null

  // アクション
  generate: (projectId: string) => Promise<void>
  selectThumbnail: (projectId: string, thumbnailId: string) => Promise<void>
  extractFrames: (projectId: string, timestamps: number[]) => Promise<void>
  reset: () => void
}

// ============================================
// 初期値
// ============================================

const initialOptions: ThumbnailOptions = {
  aspectRatio: '16:9',
  textPosition: 'center',
  colorScheme: 'warm',
  count: 2,
}

// ============================================
// Store
// ============================================

export const useThumbnailStore = create<ThumbnailStoreState>((set, get) => ({
  // モーダル
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  // 生成状態
  isGenerating: false,
  generationError: null,

  // モード
  generationMode: 'TEMPLATE',
  setGenerationMode: (mode) => set({ generationMode: mode }),

  // プロンプト
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  // オプション
  options: initialOptions,
  setOptions: (partial) =>
    set((state) => ({ options: { ...state.options, ...partial } })),

  // テンプレート
  selectedTemplateId: null,
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  // アップロード画像
  uploadedImages: [],
  addUploadedImage: (base64) =>
    set((state) => ({
      uploadedImages: [...state.uploadedImages, base64].slice(0, 5),
    })),
  removeUploadedImage: (index) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.filter((_, i) => i !== index),
    })),
  clearUploadedImages: () => set({ uploadedImages: [] }),

  // フレーム
  extractedFrames: [],
  selectedFrameTimestamps: [],
  setExtractedFrames: (frames) => set({ extractedFrames: frames }),
  toggleFrameTimestamp: (timestamp) =>
    set((state) => {
      const exists = state.selectedFrameTimestamps.includes(timestamp)
      return {
        selectedFrameTimestamps: exists
          ? state.selectedFrameTimestamps.filter((t) => t !== timestamp)
          : [...state.selectedFrameTimestamps, timestamp],
      }
    }),
  clearFrames: () => set({ extractedFrames: [], selectedFrameTimestamps: [] }),

  // 参考
  referenceUrl: '',
  setReferenceUrl: (url) => set({ referenceUrl: url }),
  referenceImages: [],
  addReferenceImage: (base64) =>
    set((state) => ({
      referenceImages: [...state.referenceImages, base64].slice(0, 5),
    })),
  removeReferenceImage: (index) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((_, i) => i !== index),
    })),
  clearReferenceImages: () => set({ referenceImages: [] }),

  // 結果
  generatedThumbnails: [],
  selectedThumbnailId: null,

  // サムネイル生成
  generate: async (projectId: string) => {
    const state = get()
    set({ isGenerating: true, generationError: null })

    try {
      const body: Record<string, unknown> = {
        projectId,
        mode: state.generationMode,
        prompt: state.prompt,
        options: state.options,
      }

      if (state.generationMode === 'TEMPLATE' && state.selectedTemplateId) {
        body.templateId = state.selectedTemplateId
      }
      if (state.generationMode === 'UPLOAD' && state.uploadedImages.length > 0) {
        body.uploadedImages = state.uploadedImages
      }
      if (state.generationMode === 'VIDEO_FRAME' && state.selectedFrameTimestamps.length > 0) {
        body.frameTimestamps = state.selectedFrameTimestamps
      }
      if (state.generationMode === 'REFERENCE') {
        if (state.referenceUrl) body.referenceUrl = state.referenceUrl
        if (state.referenceImages.length > 0) body.referenceImages = state.referenceImages
      }

      const response = await fetch('/api/thumbnail/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: string }).error || 'サムネイル生成に失敗しました'
        )
      }

      const data = (await response.json()) as {
        thumbnails: GeneratedThumbnailItem[]
      }
      set({ generatedThumbnails: data.thumbnails })
    } catch (error) {
      set({
        generationError:
          error instanceof Error ? error.message : 'サムネイル生成に失敗しました',
      })
    } finally {
      set({ isGenerating: false })
    }
  },

  // サムネイル採用
  selectThumbnail: async (projectId: string, thumbnailId: string) => {
    try {
      const response = await fetch(`/api/thumbnail/${thumbnailId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('サムネイルの採用に失敗しました')
      }

      set({ selectedThumbnailId: thumbnailId })
    } catch (error) {
      console.error('サムネイル採用エラー:', error)
    }
  },

  // フレーム抽出
  extractFrames: async (projectId: string, timestamps: number[]) => {
    try {
      const response = await fetch('/api/thumbnail/extract-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, timestamps }),
      })

      if (!response.ok) {
        throw new Error('フレーム抽出に失敗しました')
      }

      const data = (await response.json()) as { frames: ExtractedFrame[] }
      set({ extractedFrames: data.frames })
    } catch (error) {
      console.error('フレーム抽出エラー:', error)
    }
  },

  // リセット
  reset: () =>
    set({
      isGenerating: false,
      generationError: null,
      generationMode: 'TEMPLATE',
      prompt: '',
      options: initialOptions,
      selectedTemplateId: null,
      uploadedImages: [],
      extractedFrames: [],
      selectedFrameTimestamps: [],
      referenceUrl: '',
      referenceImages: [],
      generatedThumbnails: [],
      selectedThumbnailId: null,
    }),
}))
