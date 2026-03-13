'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type BuiltinSfx } from '@/lib/remotion-sfx-adapter'

interface AudioBrowserProps {
  isOpen: boolean
  onClose: () => void
  onAddAudio: (audioItem: {
    sourceUrl: string
    category: string
    sfxType?: string
    name: string
  }) => void
}

type Tab = 'se' | 'bgm' | 'voiceover'

interface SearchResult {
  id: number
  name: string
  duration: number
  previewUrl: string
  tags: string[]
}

interface Voice {
  voiceId: string
  name: string
}

export default function AudioBrowser({
  isOpen,
  onClose,
  onAddAudio,
}: AudioBrowserProps) {
  const [activeTab, setActiveTab] = useState<Tab>('se')

  // SE tab state
  const [seQuery, setSeQuery] = useState('')
  const [seResults, setSeResults] = useState<SearchResult[]>([])
  const [seLoading, setSeLoading] = useState(false)
  const [builtinSfx, setBuiltinSfx] = useState<BuiltinSfx[]>([])

  // BGM tab state
  const [bgmPrompt, setBgmPrompt] = useState('')
  const [bgmTaskId, setBgmTaskId] = useState<string | null>(null)
  const [bgmStatus, setBgmStatus] = useState<string | null>(null)
  const [bgmTrackUrl, setBgmTrackUrl] = useState<string | null>(null)
  const [bgmLoading, setBgmLoading] = useState(false)

  // Voiceover tab state
  const [voText, setVoText] = useState('')
  const [voVoiceId, setVoVoiceId] = useState('')
  const [voices, setVoices] = useState<Voice[]>([])
  const [voLoading, setVoLoading] = useState(false)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)

  // Load builtin SFX list on mount
  useEffect(() => {
    import('@/lib/remotion-sfx-adapter').then((mod) => {
      setBuiltinSfx(mod.getBuiltinSfxList())
    })
  }, [])

  const togglePreview = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingUrl === url) {
      setPlayingUrl(null)
      return
    }
    const audio = new Audio(url)
    audio.onended = () => setPlayingUrl(null)
    audio.play()
    audioRef.current = audio
    setPlayingUrl(url)
  }, [playingUrl])

  // Cleanup audio on close
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingUrl(null)
    }
  }, [isOpen])

  const searchSE = async () => {
    if (!seQuery.trim()) return
    setSeLoading(true)
    try {
      const res = await fetch(
        `/api/audio/search?q=${encodeURIComponent(seQuery)}`,
      )
      if (!res.ok) throw new Error('検索に失敗しました')
      const data = await res.json()
      setSeResults(data.results ?? [])
    } catch {
      setSeResults([])
    } finally {
      setSeLoading(false)
    }
  }

  const generateBGM = async () => {
    if (!bgmPrompt.trim()) return
    setBgmLoading(true)
    setBgmStatus('生成中...')
    setBgmTrackUrl(null)
    try {
      const res = await fetch('/api/audio/generate-bgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: bgmPrompt }),
      })
      if (!res.ok) throw new Error('BGM生成に失敗しました')
      const data = await res.json()
      setBgmTaskId(data.taskId)
      setBgmStatus(`タスクID: ${data.taskId} - 作曲中...`)
    } catch {
      setBgmStatus('エラーが発生しました')
    } finally {
      setBgmLoading(false)
    }
  }

  const generateVoiceover = async () => {
    if (!voText.trim() || !voVoiceId) return
    setVoLoading(true)
    try {
      const res = await fetch('/api/audio/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voText, voiceId: voVoiceId }),
      })
      if (!res.ok) throw new Error('ナレーション生成に失敗しました')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      onAddAudio({
        sourceUrl: url,
        category: 'voiceover',
        name: `ナレーション: ${voText.slice(0, 20)}...`,
      })
    } catch (voError) {
      console.error('voiceover generation error:', voError)
    } finally {
      setVoLoading(false)
    }
  }

  // Load voices for voiceover tab
  useEffect(() => {
    if (activeTab === 'voiceover' && voices.length === 0) {
      fetch('/api/audio/voices')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch voices')
          return res.json()
        })
        .then((data) => {
          if (data.voices && Array.isArray(data.voices) && data.voices.length > 0) {
            setVoices(data.voices.map((v: { voice_id?: string; voiceId?: string; name: string }) => ({
              voiceId: v.voice_id ?? v.voiceId ?? 'default',
              name: v.name,
            })))
          } else {
            setVoices([{ voiceId: 'default', name: 'デフォルト' }])
          }
        })
        .catch(() => {
          setVoices([{ voiceId: 'default', name: 'デフォルト' }])
        })
    }
  }, [activeTab, voices.length])

  if (!isOpen) return null

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'se', label: 'SE', icon: 'music_note' },
    { key: 'bgm', label: 'BGM', icon: 'library_music' },
    { key: 'voiceover', label: 'ナレーション', icon: 'record_voice_over' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl max-h-[80vh] bg-[#1a1411] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">オーディオブラウザ</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            data-test-id="audio-browser-close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/50 hover:text-white/80'
              }`}
              data-test-id={`audio-tab-${tab.key}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SE Tab */}
          {activeTab === 'se' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seQuery}
                  onChange={(e) => setSeQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchSE()}
                  placeholder="効果音を検索..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary"
                  data-test-id="se-search-input"
                />
                <button
                  onClick={searchSE}
                  disabled={seLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                  data-test-id="se-search-button"
                >
                  {seLoading ? '検索中...' : '検索'}
                </button>
              </div>

              {/* Builtin SFX */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-2">
                  ビルトイン SE
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {builtinSfx.map((sfx) => (
                    <div
                      key={sfx.id}
                      className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePreview(sfx.url)}
                          className="text-white/60 hover:text-primary transition-colors"
                          data-test-id={`sfx-preview-${sfx.id}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {playingUrl === sfx.url
                              ? 'stop'
                              : 'play_arrow'}
                          </span>
                        </button>
                        <span className="text-sm text-white">
                          {sfx.nameJa}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onAddAudio({
                            sourceUrl: sfx.url,
                            category: 'sfx',
                            sfxType: sfx.id,
                            name: sfx.nameJa,
                          })
                        }
                        className="text-white/40 hover:text-primary transition-colors"
                        data-test-id={`sfx-add-${sfx.id}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add_circle
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              {seResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">
                    検索結果
                  </h3>
                  <div className="space-y-2">
                    {seResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() =>
                              togglePreview(result.previewUrl)
                            }
                            className="text-white/60 hover:text-primary transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {playingUrl === result.previewUrl
                                ? 'stop'
                                : 'play_arrow'}
                            </span>
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">
                              {result.name}
                            </p>
                            <p className="text-xs text-white/40">
                              {result.duration.toFixed(1)}s
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            onAddAudio({
                              sourceUrl: result.previewUrl,
                              category: 'sfx',
                              name: result.name,
                            })
                          }
                          className="text-white/40 hover:text-primary transition-colors shrink-0 ml-2"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            add_circle
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BGM Tab */}
          {activeTab === 'bgm' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  BGMのイメージをプロンプトで入力
                </label>
                <textarea
                  value={bgmPrompt}
                  onChange={(e) => setBgmPrompt(e.target.value)}
                  placeholder="例: 明るく楽しいポップな曲、テンポ120BPM"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary resize-none"
                  data-test-id="bgm-prompt-input"
                />
              </div>
              <button
                onClick={generateBGM}
                disabled={bgmLoading || !bgmPrompt.trim()}
                className="w-full px-4 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                data-test-id="bgm-generate-button"
              >
                {bgmLoading ? '生成中...' : 'BGMを生成'}
              </button>

              {bgmStatus && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/80">{bgmStatus}</p>
                  {bgmTrackUrl && (
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => togglePreview(bgmTrackUrl)}
                        className="text-white/60 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined">
                          {playingUrl === bgmTrackUrl
                            ? 'stop'
                            : 'play_arrow'}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          onAddAudio({
                            sourceUrl: bgmTrackUrl,
                            category: 'bgm',
                            name: `BGM: ${bgmPrompt.slice(0, 20)}`,
                          })
                        }
                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-lg transition-colors"
                      >
                        追加
                      </button>
                    </div>
                  )}
                  {bgmTaskId && !bgmTrackUrl && (
                    <p className="text-xs text-white/40 mt-2">
                      タスクID: {bgmTaskId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voiceover Tab */}
          {activeTab === 'voiceover' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  ボイス選択
                </label>
                <select
                  value={voVoiceId}
                  onChange={(e) => setVoVoiceId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary"
                  data-test-id="voiceover-voice-select"
                >
                  <option value="">ボイスを選択...</option>
                  {voices.map((voice) => (
                    <option key={voice.voiceId} value={voice.voiceId}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  ナレーションテキスト
                </label>
                <textarea
                  value={voText}
                  onChange={(e) => setVoText(e.target.value)}
                  placeholder="ナレーションのテキストを入力..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary resize-none"
                  data-test-id="voiceover-text-input"
                />
              </div>
              <button
                onClick={generateVoiceover}
                disabled={voLoading || !voText.trim() || !voVoiceId}
                className="w-full px-4 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                data-test-id="voiceover-generate-button"
              >
                {voLoading ? '生成中...' : 'ナレーションを生成'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
