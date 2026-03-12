'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout'
import { useSession } from '@/lib/auth-client'

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [referenceUrl, setReferenceUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const redirectToSignIn = () => {
    router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/home'))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find((file) => file.type.startsWith('video/'))
    if (videoFile) {
      setSelectedFile(videoFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('動画ファイルを選択してください')
      return
    }

    if (!session?.user) {
      setError('アップロードを始めるにはログインが必要です')
      redirectToSignIn()
      return
    }

    setIsUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      // プロジェクト作成
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFile.name,
        }),
      })

      const projectData = await readJsonSafely<{ error?: string; project?: { id?: string } }>(projectRes)

      if (!projectRes.ok) {
        if (projectRes.status === 401) {
          redirectToSignIn()
          throw new Error('アップロードを始めるにはログインが必要です')
        }
        throw new Error(projectData?.error || 'プロジェクトの作成に失敗しました')
      }

      const project = projectData?.project
      if (!project?.id) {
        throw new Error('プロジェクトの作成結果が不正です')
      }
      setUploadProgress(20)

      // ファイルアップロード
      const formData = new FormData()
      formData.append('projectId', project.id)
      formData.append('file', selectedFile)
      formData.append('sourceType', 'upload')
      formData.append('autoProcess', 'false')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await readJsonSafely<{ error?: string }>(uploadRes)

      if (!uploadRes.ok) {
        if (uploadRes.status === 401) {
          redirectToSignIn()
          throw new Error('アップロードを始めるにはログインが必要です')
        }
        throw new Error(uploadData?.error || 'ファイルのアップロードに失敗しました')
      }

      setUploadProgress(100)

      const styleSelectionUrl =
        '/styles?projectId=' +
        encodeURIComponent(project.id) +
        (referenceUrl ? `&youtubeUrl=${encodeURIComponent(referenceUrl)}` : '')

      router.push(styleSelectionUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header currentPage="edit" />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2d1f18] dark:text-white mb-4">
            新しいプロジェクト
          </h1>
          <p className="text-[#8a756b] text-lg">
            動画をアップロードして、AIで自動編集を始めましょう
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-[#f0e6df] dark:border-[#3a2a20] bg-white dark:bg-[#2a1d15] hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-test-id="landing-upload-area"
        >
          <input
            type="file"
            id="video-upload"
            accept="video/*"
            onChange={handleFileInput}
            className="hidden"
          />

          {!selectedFile ? (
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-white text-3xl">
                  cloud_upload
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#2d1f18] dark:text-white mb-2">
                動画をアップロード
              </h3>
              <p className="text-[#8a756b] text-sm mb-4">
                ドラッグ&ドロップまたはクリックして選択
              </p>
              <p className="text-xs text-[#8a756b]">
                対応形式: MP4, MOV, AVI（最大2GB）
              </p>
            </label>
          ) : (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-5xl mb-4">
                check_circle
              </span>
              <h3 className="text-lg font-bold text-[#2d1f18] dark:text-white mb-1">
                {selectedFile.name}
              </h3>
              <p className="text-[#8a756b] text-sm mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-primary hover:underline"
              >
                ファイルを変更
              </button>
            </div>
          )}
        </div>

        {/* Reference Video Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-bold text-[#2d1f18] dark:text-white">参考動画（スタイル学習）</h3>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded">PRO</span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a756b]">
              smart_display
            </span>
            <input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="参考にしたいYouTube動画のURL"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-primary/30 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 text-[#2d1f18] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none"
              data-test-id="landing-reference-url-input"
            />
          </div>
          <p className="mt-2 text-xs text-[#8a756b]">
            好きなYouTuberの編集スタイルを学習して、あなたの動画に適用します
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2d1f18] dark:text-white">
                アップロード中...
              </span>
              <span className="text-sm text-[#8a756b]">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-[#f4ece6] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-test-id="landing-start-editing-button"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                処理中...
              </span>
            ) : !session?.user ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">login</span>
                ログインして編集を開始
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">auto_fix_high</span>
                スタイル選択へ進む
              </span>
            )}
          </button>
        </div>

        {/* Quick Start Guide */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { num: '1', title: '動画アップロード', desc: '編集したい素材動画を選択', icon: 'upload' },
            { num: '2', title: 'スタイル選択', desc: '好きなクリエイターのスタイルを学習', icon: 'palette' },
            { num: '3', title: 'AI自動編集', desc: '学習したスタイルで自動編集完了', icon: 'auto_awesome' },
          ].map((step) => (
            <div key={step.num} className="text-center p-6 bg-white dark:bg-[#2a1d15] rounded-xl border border-[#f0e6df] dark:border-[#3a2a20]">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">{step.num}</span>
              </div>
              <h3 className="font-bold text-[#2d1f18] dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-[#8a756b]">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
