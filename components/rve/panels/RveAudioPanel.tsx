'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRveBridge } from '@/lib/rve-bridge'
import { Button } from '@/app/reactvideoeditor/pro/components/ui/button'
import { Music, Play, Square, PlusCircle, Search } from 'lucide-react'
import type { BuiltinSfx } from '@/lib/remotion-sfx-adapter'

type Tab = 'se' | 'bgm' | 'voiceover'

interface SearchResult {
  id: number
  name: string
  duration: number
  previewUrl: string
}

export function RveAudioPanel() {
  const { addAudio } = useRveBridge()
  const [activeTab, setActiveTab] = useState<Tab>('se')

  // SE tab state
  const [seQuery, setSeQuery] = useState('')
  const [seResults, setSeResults] = useState<SearchResult[]>([])
  const [seLoading, setSeLoading] = useState(false)
  const [builtinSfx, setBuiltinSfx] = useState<BuiltinSfx[]>([])

  // BGM tab state
  const [bgmPrompt, setBgmPrompt] = useState('')
  const [bgmStatus, setBgmStatus] = useState<string | null>(null)
  const [bgmTrackUrl, setBgmTrackUrl] = useState<string | null>(null)
  const [bgmLoading, setBgmLoading] = useState(false)

  // Voiceover tab state
  const [voText, setVoText] = useState('')
  const [voVoiceId, setVoVoiceId] = useState('')
  const [voices, setVoices] = useState<{ voiceId: string; name: string }[]>([])
  const [voLoading, setVoLoading] = useState(false)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)

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

  const searchSE = async () => {
    if (!seQuery.trim()) return
    setSeLoading(true)
    try {
      const res = await fetch(`/api/audio/search?q=${encodeURIComponent(seQuery)}`)
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
      addAudio(url, 10) // default 10s duration estimate
    } catch (error) {
      console.error('voiceover generation error:', error)
    } finally {
      setVoLoading(false)
    }
  }

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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'se', label: 'SE' },
    { key: 'bgm', label: 'BGM' },
    { key: 'voiceover', label: 'ナレーション' },
  ]

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SE Tab */}
      {activeTab === 'se' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={seQuery}
              onChange={(e) => setSeQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSE()}
              placeholder="効果音を検索..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={searchSE} disabled={seLoading} size="sm" variant="outline">
              <Search className="h-3 w-3" />
            </Button>
          </div>

          {builtinSfx.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">ビルトイン SE</p>
              <div className="grid grid-cols-1 gap-1">
                {builtinSfx.map((sfx) => (
                  <div
                    key={sfx.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePreview(sfx.url)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {playingUrl === sfx.url ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="text-sm text-foreground">{sfx.nameJa}</span>
                    </div>
                    <button
                      onClick={() => addAudio(sfx.url, 3)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seResults.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">検索結果</p>
              <div className="space-y-1">
                {seResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => togglePreview(result.previewUrl)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {playingUrl === result.previewUrl ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground">{result.duration.toFixed(1)}s</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addAudio(result.previewUrl, result.duration)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0 ml-2"
                    >
                      <PlusCircle className="h-4 w-4" />
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              BGMのイメージをプロンプトで入力
            </label>
            <textarea
              value={bgmPrompt}
              onChange={(e) => setBgmPrompt(e.target.value)}
              placeholder="例: 明るく楽しいポップな曲、テンポ120BPM"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <Button
            onClick={generateBGM}
            disabled={bgmLoading || !bgmPrompt.trim()}
            className="w-full"
            size="sm"
          >
            <Music className="h-4 w-4 mr-1" />
            {bgmLoading ? '生成中...' : 'BGMを生成'}
          </Button>
          {bgmStatus && (
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-sm text-foreground">{bgmStatus}</p>
              {bgmTrackUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => togglePreview(bgmTrackUrl)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {playingUrl === bgmTrackUrl ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <Button
                    onClick={() => addAudio(bgmTrackUrl, 30)}
                    size="sm"
                    variant="outline"
                  >
                    追加
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Voiceover Tab */}
      {activeTab === 'voiceover' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">ボイス選択</label>
            <select
              value={voVoiceId}
              onChange={(e) => setVoVoiceId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <label className="block text-xs text-muted-foreground mb-1.5">ナレーションテキスト</label>
            <textarea
              value={voText}
              onChange={(e) => setVoText(e.target.value)}
              placeholder="ナレーションのテキストを入力..."
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <Button
            onClick={generateVoiceover}
            disabled={voLoading || !voText.trim() || !voVoiceId}
            className="w-full"
            size="sm"
          >
            {voLoading ? '生成中...' : 'ナレーションを生成'}
          </Button>
        </div>
      )}
    </div>
  )
}
