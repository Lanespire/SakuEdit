'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StylesPage() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const presetStyles = [
    {
      id: 'hikakin',
      name: 'HIKAKIN風',
      description: 'テンション高め、カラフル字幕、早いカット',
      thumbnail: '🎮',
    },
    {
      id: 'mizutamari',
      name: '水溜りボンド風',
      description: 'シンプル字幕、テンポ良いカット、見やすい構成',
      thumbnail: '🎬',
    },
    {
      id: 'quizknock',
      name: 'QuizKnock風',
      description: '知的な構成、図解字幕、落ち着いたテンポ',
      thumbnail: '📚',
    },
  ];

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
            <Link href="/home" className="text-muted hover:text-foreground transition-colors">
              ← 戻る
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">編集スタイルを選択</h1>
          <p className="text-muted text-lg">
            プリセットから選ぶか、YouTube URLで好きなクリエイターのスタイルを学習
          </p>
        </div>

        {/* Preset Styles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">プリセットスタイル</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {presetStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`text-left p-6 rounded-xl border-2 transition-all ${
                  selectedStyle === style.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <div className="text-5xl mb-4">{style.thumbnail}</div>
                <h3 className="text-xl font-bold mb-2">{style.name}</h3>
                <p className="text-sm text-muted">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom YouTube Style */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">カスタムスタイル学習</h2>
          <div className="bg-surface border border-border rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">YouTube URLから学習</h3>
                <p className="text-muted mb-4">
                  好きなクリエイターの動画URLを入力すると、編集スタイルを自動分析します
                </p>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
            </div>

            {youtubeUrl && (
              <div className="bg-info/10 border border-info/30 rounded-lg p-4 text-sm text-info">
                <strong>💡 ヒント:</strong> 編集スタイルが明確な動画を選ぶと、より良い結果が得られます
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href="/home"
            className="px-8 py-4 bg-surface border border-border text-foreground rounded-xl font-bold text-lg hover:bg-surface-hover transition-all"
          >
            戻る
          </Link>
          <button
            disabled={!selectedStyle && !youtubeUrl}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              selectedStyle || youtubeUrl
                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-xl hover:shadow-primary/50'
                : 'bg-surface text-muted cursor-not-allowed'
            }`}
          >
            次へ: AI処理開始 →
          </button>
        </div>
      </main>
    </div>
  );
}
