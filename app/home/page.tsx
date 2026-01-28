'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    if (videoFile) {
      setSelectedFile(videoFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SakuEdit
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/projects" className="text-muted hover:text-foreground transition-colors">
                プロジェクト
              </Link>
              <button className="w-10 h-10 bg-surface rounded-full flex items-center justify-center hover:bg-surface-hover transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">新しいプロジェクト</h1>
          <p className="text-muted text-lg">
            動画をアップロードして、AIで自動編集を始めましょう
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border bg-surface hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
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
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">動画をアップロード</h3>
              <p className="text-muted mb-4">
                ドラッグ&ドロップまたはクリックして選択
              </p>
              <div className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
                ファイルを選択
              </div>
              <p className="text-sm text-muted mt-6">
                対応形式: MP4, MOV, AVI（最大2GB）
              </p>
            </label>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-success/20 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{selectedFile.name}</h3>
              <p className="text-muted mb-6">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-6 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-hover transition-colors"
                >
                  変更
                </button>
                <Link
                  href="/styles"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  次へ: スタイル選択 →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h3 className="font-bold mb-2">動画アップロード</h3>
            <p className="text-sm text-muted">
              編集したい素材動画を選択
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-secondary font-bold text-xl">2</span>
            </div>
            <h3 className="font-bold mb-2">スタイル選択</h3>
            <p className="text-sm text-muted">
              好きなクリエイターのスタイルを学習
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-accent font-bold text-xl">3</span>
            </div>
            <h3 className="font-bold mb-2">AI自動編集</h3>
            <p className="text-sm text-muted">
              学習したスタイルで自動編集完了
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
