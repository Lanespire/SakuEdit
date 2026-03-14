export interface StylePresetDefinition {
  id: string
  name: string
  description: string
  category: string
  badge: string
  accentColor: string
  coverGradient: string
  coverImage?: string
  usageLabel: string
  cutSettings: {
    minSilence: number
    aggressiveness: 'low' | 'medium' | 'high'
    targetCutsPerMinute: number
  }
  subtitleSettings: {
    font: string
    size: number
    position: 'bottom' | 'middle' | 'top'
    color: string
    backgroundColor: string
  }
  bgmSettings: {
    genre: string
    volume: number
    tempo: 'slow' | 'medium' | 'fast'
  }
  tempoSettings: {
    minClipDuration: number
    maxClipDuration: number
  }
}

export const STYLE_PRESETS: StylePresetDefinition[] = [
  {
    id: 'youtuber-classic',
    name: 'YouTuber定番',
    description: 'テンポの良いカットと、ポップで読みやすい字幕スタイル。',
    category: 'エンタメ',
    badge: '定番',
    accentColor: '#f97316',
    coverGradient: 'from-[#4d8a7a] to-[#8bb08d]',
    coverImage: '/style-covers/youtuber-classic.png',
    usageLabel: '12,345人が使用',
    cutSettings: { minSilence: 0.25, aggressiveness: 'high', targetCutsPerMinute: 18 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 28,
      position: 'bottom',
      color: '#FFFFFF',
      backgroundColor: '#00000099',
    },
    bgmSettings: { genre: 'upbeat', volume: 0.32, tempo: 'fast' },
    tempoSettings: { minClipDuration: 1.2, maxClipDuration: 5.5 },
  },
  {
    id: 'business-seminar',
    name: 'ビジネス・セミナー',
    description: '落ち着いた配色と、情報が読みやすい長めの構成。',
    category: 'ビジネス',
    badge: 'Business',
    accentColor: '#3b82f6',
    coverGradient: 'from-[#5c8fc1] to-[#9ec0e8]',
    coverImage: '/style-covers/business-seminar.png',
    usageLabel: '8,920人が使用',
    cutSettings: { minSilence: 0.45, aggressiveness: 'low', targetCutsPerMinute: 9 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 22,
      position: 'bottom',
      color: '#FFFFFF',
      backgroundColor: '#0f172a99',
    },
    bgmSettings: { genre: 'corporate', volume: 0.18, tempo: 'medium' },
    tempoSettings: { minClipDuration: 3, maxClipDuration: 10 },
  },
  {
    id: 'shorts-boost',
    name: 'Shorts最適化',
    description: '縦型向けの大きな字幕と、飽きさせない超高速テンポ。',
    category: 'Shorts',
    badge: '人気急上昇',
    accentColor: '#8b5cf6',
    coverGradient: 'from-[#3182ce] to-[#63b3ed]',
    coverImage: '/style-covers/shorts-boost.png',
    usageLabel: '今週 +15%',
    cutSettings: { minSilence: 0.18, aggressiveness: 'high', targetCutsPerMinute: 28 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 32,
      position: 'middle',
      color: '#FFFFFF',
      backgroundColor: '#111827cc',
    },
    bgmSettings: { genre: 'energetic', volume: 0.35, tempo: 'fast' },
    tempoSettings: { minClipDuration: 0.8, maxClipDuration: 3.2 },
  },
  {
    id: 'cinematic-vlog',
    name: '映画風シネマ',
    description: '余白を活かし、しっとり見せる Vlog 向けの構成。',
    category: 'Vlog',
    badge: 'Vlog',
    accentColor: '#78716c',
    coverGradient: 'from-[#111827] to-[#374151]',
    coverImage: '/style-covers/cinematic-vlog.png',
    usageLabel: '4,100人が使用',
    cutSettings: { minSilence: 0.4, aggressiveness: 'medium', targetCutsPerMinute: 8 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 20,
      position: 'bottom',
      color: '#F9FAFB',
      backgroundColor: '#00000066',
    },
    bgmSettings: { genre: 'ambient', volume: 0.22, tempo: 'slow' },
    tempoSettings: { minClipDuration: 3.5, maxClipDuration: 12 },
  },
  {
    id: 'edu-zundamon',
    name: 'ずんだもん風・解説',
    description: '強調テロップを多用し、わかりやすさを優先した解説向け。',
    category: '教育',
    badge: '教育',
    accentColor: '#22c55e',
    coverGradient: 'from-[#3b7f74] to-[#6fc4a8]',
    coverImage: '/style-covers/edu-zundamon.png',
    usageLabel: '15,200人が使用',
    cutSettings: { minSilence: 0.22, aggressiveness: 'medium', targetCutsPerMinute: 14 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 30,
      position: 'bottom',
      color: '#111827',
      backgroundColor: '#fde047cc',
    },
    bgmSettings: { genre: 'light', volume: 0.2, tempo: 'medium' },
    tempoSettings: { minClipDuration: 1.8, maxClipDuration: 6.5 },
  },
  {
    id: 'gaming-highlight',
    name: 'ゲーム実況ハイライト',
    description: '盛り上がるシーンを前に出し、派手な見せ方に寄せた実況向け。',
    category: 'ゲーム',
    badge: 'ゲーム',
    accentColor: '#6366f1',
    coverGradient: 'from-[#0f172a] to-[#334155]',
    coverImage: '/style-covers/gaming-highlight.png',
    usageLabel: '7,800人が使用',
    cutSettings: { minSilence: 0.15, aggressiveness: 'high', targetCutsPerMinute: 24 },
    subtitleSettings: {
      font: 'Noto Sans JP',
      size: 30,
      position: 'bottom',
      color: '#FFFFFF',
      backgroundColor: '#4f46e5aa',
    },
    bgmSettings: { genre: 'intense', volume: 0.38, tempo: 'fast' },
    tempoSettings: { minClipDuration: 1, maxClipDuration: 4 },
  },
]

export function getStylePreset(presetId: string) {
  return STYLE_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getStylePresetCategories() {
  return ['すべて', ...new Set(STYLE_PRESETS.map((preset) => preset.category))]
}
