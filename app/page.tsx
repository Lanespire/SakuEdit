'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProcessingToEditorDemo } from '@/components/ProcessingToEditorDemo';
import { SERVICE_NAME } from '@/lib/constants';

// ─── Data ──────────────────────────────────────────────

const WAVE = [30,58,42,78,52,68,35,88,55,72,40,82,50,62,45,76,32,70,55,85,42,75,58,48,80,45,68,38,78,62,52,72,44,88,50,65,78,48,70,38,55,82,60,72,42,52,78,65,45,70];
const SILENCE_WAVE = [35,60,48,75,55,68,8,4,6,3,5,3,72,85,58,42,78,62,50,5,3,4,2,68,55,80,45,72,60,48,75,55,68,42,8,3,5,4,6,72,85,58,78,62,50,68,55,80,45,72];

// ─── Small Components ──────────────────────────────────

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600"
        aria-label="メニュー"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg px-4 py-4 space-y-3 z-50">
          <Link href="#how-it-works" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>使い方</Link>
          <Link href="#features" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>機能</Link>
          <Link href="#pricing" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>料金</Link>
          <Link href="/home" className="block text-center px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm">
            無料で始める
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Editor Mockup with annotation overlays ────────────

function EditorMockup() {
  return (
    <div className="relative">
      <div
        className="rounded-2xl border border-gray-200 shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden"
        role="img"
        aria-label="SakuEdit エディタのプレビュー画面"
      >
        {/* Window Chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e2e] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c940]/80" />
          </div>
          <span className="text-[11px] text-white/40 ml-2 font-mono">{SERVICE_NAME} — 新しいVlog_01.mp4</span>
        </div>

        {/* Editor Body */}
        <div className="flex bg-[#1a1a2e]">
          {/* Sidebar */}
          <div className="w-11 bg-[#16162a] border-r border-white/[0.06] py-3 flex-col items-center gap-2.5 shrink-0 hidden sm:flex">
            {[
              { active: true,  d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
              { active: false, d: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
              { active: false, d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
              { active: false, d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ].map((item, i) => (
              <div key={i} className={`w-7 h-7 rounded-md flex items-center justify-center ${item.active ? 'bg-primary/20 ring-1 ring-primary/30' : 'bg-white/[0.04]'}`}>
                <svg className={`w-3.5 h-3.5 ${item.active ? 'text-primary' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.d} />
                </svg>
              </div>
            ))}
          </div>

          {/* Main Area */}
          <div className="flex-1 min-w-0">
            <div className="m-3 sm:m-4 rounded-lg overflow-hidden bg-[#0d0d1a] aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a3e] to-[#15152a]" />
              {/* Auto-generated subtitle highlight */}
              <div className="absolute bottom-[14%] left-0 right-0 text-center px-4">
                <span className="inline-block bg-white/90 text-[#1a1a2e] px-3 py-1 rounded text-xs sm:text-sm font-bold shadow-sm">
                  今日はプログラミングの話をします
                </span>
              </div>
              <div className="absolute bottom-2 left-3 right-3">
                <div className="w-full h-1 bg-white/20 rounded-full">
                  <div className="h-full w-[42%] bg-primary rounded-full" />
                </div>
              </div>
            </div>
            {/* Timeline with auto-cut indicators */}
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] text-white/30 font-mono">01:23</span>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] text-white/30 font-mono">03:45</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/25 w-6 shrink-0">映像</span>
                <div className="flex-1 h-5 flex gap-0.5">
                  <div className="h-full bg-primary/30 rounded-sm flex-[3]" />
                  <div className="h-full bg-red-400/20 rounded-sm flex-[0.5] border border-red-400/30 border-dashed" />
                  <div className="h-full bg-primary/30 rounded-sm flex-[2]" />
                  <div className="h-full bg-red-400/20 rounded-sm flex-[0.4] border border-red-400/30 border-dashed" />
                  <div className="h-full bg-primary/30 rounded-sm flex-[4]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/25 w-6 shrink-0">字幕</span>
                <div className="flex-1 h-4 flex gap-1">
                  <div className="h-full bg-blue-400/25 rounded-sm flex-[2]" />
                  <div className="h-full bg-blue-400/25 rounded-sm flex-[1]" />
                  <div className="h-full bg-blue-400/25 rounded-sm flex-[3]" />
                  <div className="h-full bg-blue-400/25 rounded-sm flex-[1.5]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/25 w-6 shrink-0">音声</span>
                <div className="flex-1 h-4 bg-green-500/[0.08] rounded-sm flex items-end px-px gap-px">
                  {WAVE.map((h, i) => (
                    <div key={i} className="flex-1 bg-green-400/30 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Property Panel */}
          <div className="w-40 bg-[#16162a] border-l border-white/[0.06] p-3 hidden lg:block shrink-0">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">プロパティ</p>
            <div className="space-y-2.5">
              <div>
                <p className="text-[9px] text-white/25 mb-1">フォント</p>
                <div className="h-6 bg-white/[0.04] rounded border border-white/[0.08] px-2 flex items-center">
                  <span className="text-[10px] text-white/50">Noto Sans JP</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-white/25 mb-1">サイズ</p>
                <div className="h-6 bg-white/[0.04] rounded border border-white/[0.08] px-2 flex items-center">
                  <span className="text-[10px] text-white/50">24px</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-white/25 mb-1">色</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-white rounded-sm border border-white/20" />
                  <span className="text-[10px] text-white/50">#FFFFFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annotation callouts (desktop only) */}
      <div className="hidden md:block">
        <div className="absolute -right-2 top-[38%] translate-x-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-primary/40" />
            <span className="text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded">自動生成された字幕</span>
          </div>
        </div>
        <div className="absolute -right-2 top-[72%] translate-x-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-red-400/40" />
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">無音区間を自動検出</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ──── Nav ──── */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2" data-test-id="header-logo">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">{SERVICE_NAME}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">使い方</Link>
              <Link href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">機能</Link>
              <Link href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" data-test-id="header-pricing-link">料金</Link>
              <Link href="/home" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors" data-test-id="landing-start-editing-button">
                無料で始める
              </Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ──── Hero ──── */}
      <section className="pt-16 sm:pt-20 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-primary mb-4 tracking-wide">YouTube・SNS動画の編集を、もっとラクに</p>
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.12] mb-5">
            動画を上げたら、
            <br />
            <span className="text-primary">編集は終わっている</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            アップロード後に無音カット・字幕生成・サムネイル作成まで一気に処理。
            <br className="hidden sm:block" />
            必要なところだけ手直しして、すぐに公開できます。
          </p>
          <div className="mb-3">
            <Link
              href="/home"
              className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
              data-test-id="cta-start-free"
            >
              無料で試してみる
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            クレジットカード不要 ・ 90分の動画まで無料
          </p>
        </div>
      </section>

      {/* ──── Product Screenshot (annotated) ──── */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <EditorMockup />
        </div>
      </section>

      {/* ──── Trust Bar ──── */}
      <section className="py-5 px-4 border-y border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>日本語特化の音声認識で字幕精度 <strong className="text-gray-900">99%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong className="text-gray-900">0.3秒</strong>単位で無音・フィラーを検出</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>サムネイルもテンプレートから<strong className="text-gray-900">一括生成</strong></span>
          </div>
        </div>
      </section>

      {/* ──── How it works (Demo) ──── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-primary mb-2 tracking-wide">HOW IT WORKS</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              アップロードから編集完了まで、3分
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              動画をアップロードすると、無音カット・字幕生成・サムネイル作成が自動で進みます。
              完了後はそのまま微調整して書き出せます。
            </p>
          </div>
          <ProcessingToEditorDemo />
        </div>
      </section>

      {/* ──── Feature 1: 無音カット ──── */}
      <section id="features" className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Visual */}
            <div
              className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 order-2 md:order-1 shadow-sm"
              data-test-id="feature-silence-cut"
            >
              <div className="flex items-end gap-[2px] h-32 sm:h-40">
                {SILENCE_WAVE.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-colors ${h < 10 ? 'bg-red-400/60' : 'bg-gray-900/15'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 bg-red-400/60 rounded-sm" />
                  <span>自動検出された無音・フィラー区間</span>
                </div>
                <span className="text-xs text-gray-400">3箇所 / 合計12秒</span>
              </div>
            </div>
            {/* Text */}
            <div className="order-1 md:order-2">
              <p className="text-sm font-semibold text-primary mb-2 tracking-wide">SILENCE CUT</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                無音・フィラーを
                <br />自動でカット
              </h2>
              <p className="text-gray-600 leading-relaxed">
                「えー」「あー」や無音区間を0.3秒単位で検出して自動カット。
                手作業で数時間かかるカット編集が、アップロードするだけで完了します。
                カット箇所は後から個別に調整できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Feature 2: 字幕生成 ──── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-sm font-semibold text-primary mb-2 tracking-wide">SUBTITLE</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                字幕を自動生成、
                <br />スタイルも選べる
              </h2>
              <p className="text-gray-600 leading-relaxed">
                日本語に最適化された音声認識で字幕を自動生成。
                タイムコード付きで、フォント・サイズ・色などのスタイルも後から変更できます。
              </p>
            </div>
            {/* Visual: subtitle style comparison */}
            <div
              className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-gray-800 shadow-sm"
              data-test-id="feature-subtitle"
            >
              <div className="relative aspect-[16/10]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a3e] to-[#15152a]" />
                {/* REC indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/70" />
                  <span className="text-[10px] text-white/30 font-mono">REC 01:23:15</span>
                </div>
                {/* Multiple subtitle style previews */}
                <div className="absolute bottom-6 left-0 right-0 px-6 space-y-2">
                  {/* Active style */}
                  <div className="text-center">
                    <span className="inline-block bg-white/90 text-[#1a1a2e] px-4 py-2 rounded-lg text-sm sm:text-base font-bold shadow-sm">
                      今日はプログラミングの話をします
                    </span>
                  </div>
                  {/* Alternative styles preview */}
                  <div className="flex justify-center gap-2">
                    <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded border border-white/10">白背景</span>
                    <span className="text-[10px] bg-primary/20 text-primary/70 px-2 py-0.5 rounded border border-primary/20">ブランドカラー</span>
                    <span className="text-[10px] bg-black/30 text-white/50 px-2 py-0.5 rounded border border-white/10">シンプル</span>
                  </div>
                  {/* Timecode */}
                  <div className="flex justify-center gap-2">
                    <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded font-mono">00:15:02</span>
                    <span className="text-[10px] text-white/25">→</span>
                    <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded font-mono">00:18:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Feature 3: サムネイル ──── */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Visual: thumbnail candidates */}
            <div
              className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 order-2 md:order-1 shadow-sm"
              data-test-id="feature-thumbnail"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Selected thumbnail (realistic) */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/40 relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center mb-1.5">
                      <svg className="w-4 h-4 text-primary/60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <div className="w-full">
                      <div className="h-2 bg-gray-900/80 rounded-sm w-[85%] mx-auto mb-1" />
                      <div className="h-1.5 bg-primary/40 rounded-sm w-[60%] mx-auto" />
                    </div>
                  </div>
                </div>
                {/* Candidate 2 */}
                <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    <div className="w-7 h-7 bg-gray-200 rounded-full mb-1.5" />
                    <div className="w-full">
                      <div className="h-2 bg-gray-300 rounded-sm w-[75%] mx-auto mb-1" />
                      <div className="h-1.5 bg-gray-200 rounded-sm w-[50%] mx-auto" />
                    </div>
                  </div>
                </div>
                {/* Candidate 3 */}
                <div className="aspect-video bg-gray-800 rounded-xl border border-gray-700 relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    <div className="h-2 bg-white/80 rounded-sm w-[80%] mx-auto mb-1" />
                    <div className="h-1.5 bg-white/40 rounded-sm w-[55%] mx-auto" />
                  </div>
                </div>
                {/* Candidate 4: from video frame */}
                <div className="aspect-video rounded-xl border border-gray-200 relative overflow-hidden bg-gradient-to-br from-[#2a2a3e] to-[#15152a]">
                  <div className="absolute inset-0 flex items-end justify-center p-2">
                    <span className="text-[9px] text-white/50 bg-black/40 px-1.5 py-0.5 rounded">動画フレームから生成</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>4候補から選択</span>
                <span className="text-primary font-medium">テンプレートを変更</span>
              </div>
            </div>
            {/* Text */}
            <div className="order-1 md:order-2">
              <p className="text-sm font-semibold text-primary mb-2 tracking-wide">THUMBNAIL</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                サムネイルも
                <br />この画面で完結
              </h2>
              <p className="text-gray-600 leading-relaxed">
                テンプレートを選ぶか、動画のフレームから自動生成。
                複数の候補から選ぶだけで、Canvaなどの別ツールを開く必要がなくなります。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Secondary Features ──── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">さらにできること</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">チャットで編集指示</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                「字幕を大きくして」「BGMを追加して」— チャットで指示するだけで編集を反映。
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">テンポ自動調整</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                カット間隔を自動で整えて、テンポの良い動画に仕上がります。
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">スタイル分析</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                参考動画のURLを入れるだけで、編集スタイルを分析して再現できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section id="pricing" className="py-16 sm:py-20 px-4 bg-gray-50" data-test-id="pricing-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">まずは無料で試す</h2>
            <p className="text-gray-500 mt-2">いつでもアップグレード・解約可能</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-gray-900 mb-1">Free</p>
              <p className="text-xs text-gray-500 mb-3">まず試してみたい方</p>
              <p className="text-3xl font-bold mb-4">¥0<span className="text-sm font-normal text-gray-400">/月</span></p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />月2本・90分まで
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />1080p書き出し
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />基本字幕スタイル
                </li>
              </ul>
              <Link href="/home" className="block text-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
                無料で始める
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-white border-2 border-primary rounded-2xl p-6 relative shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-bold rounded-full">おすすめ</div>
              <p className="text-sm font-bold text-gray-900 mb-1">Pro</p>
              <p className="text-xs text-gray-500 mb-3">週1〜2本投稿する方</p>
              <p className="text-3xl font-bold mb-4">¥2,480<span className="text-sm font-normal text-gray-400">/月</span></p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />月20本・600分まで
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />4K書き出し
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />サムネイル生成
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />全字幕スタイル
                </li>
              </ul>
              <Link href="/home" className="block text-center px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors">
                Proを試す
              </Link>
            </div>
            {/* Business */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-gray-900 mb-1">Business</p>
              <p className="text-xs text-gray-500 mb-3">チーム・量産運用向け</p>
              <p className="text-3xl font-bold mb-4">¥8,980<span className="text-sm font-normal text-gray-400">/月</span></p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />無制限・2400分まで
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />優先処理キュー
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />スタイル分析
                </li>
              </ul>
              <Link href="/home" className="block text-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <section className="py-16 sm:py-20 px-4" data-test-id="final-cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            まずは1本、無料で試してみませんか
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            90分までの動画を無料で自動編集できます。
            アカウント登録は30秒で完了します。
          </p>
          <Link href="/home" className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
            無料で始める
          </Link>
          <p className="mt-4 text-gray-500 text-sm">クレジットカード不要</p>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-sm">{SERVICE_NAME}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">プライバシーポリシー</Link>
            <Link href="/commercial-transactions" className="hover:text-gray-700 transition-colors">特定商取引法</Link>
          </div>
          <span className="text-xs text-gray-400">&copy; 2026 {SERVICE_NAME}</span>
        </div>
      </footer>
    </div>
  );
}
