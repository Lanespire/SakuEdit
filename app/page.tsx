'use client';

import Link from 'next/link';
import {
  ScrollReveal,
  CountUp,
  StaggerContainer,
  StaggerItem,
  PulseRing,
  GradientText,
} from '@/components/animations';
import { ProcessingToEditorDemo } from '@/components/ProcessingToEditorDemo';
import { SERVICE_NAME, SERVICE_TAGLINE, SERVICE_DESCRIPTION } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <ScrollReveal direction="left">
              <div className="flex items-center gap-2" data-test-id="header-logo">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-2xl font-bold">
                  <GradientText>{SERVICE_NAME}</GradientText>
                </span>
              </div>
            </ScrollReveal>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted hover:text-foreground transition-colors">
                機能
              </Link>
              <Link href="#how-it-works" className="text-muted hover:text-foreground transition-colors">
                使い方
              </Link>
              <Link href="/pricing" className="text-muted hover:text-foreground transition-colors" data-test-id="header-pricing-link">
                料金
              </Link>
              <Link
                href="/home"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5"
                data-test-id="landing-start-editing-button"
              >
                今すぐ始める
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <ScrollReveal>
              <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full">
                <span className="text-sm font-medium text-primary">YouTubeスタイルを学習・再現</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="block text-foreground mb-2">
                  あのクリエイターみたいな
                </span>
                <GradientText className="text-5xl sm:text-6xl md:text-8xl">
                  動画が作れる
                </GradientText>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                YouTube URLを指定するだけで、<span className="text-foreground font-medium">憧れのクリエイターの編集スタイル</span>をAIが学習。
                <br />
                あなたの動画に、プロの技術を自動適用。
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <PulseRing>
                  <Link
                    href="/home"
                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/40 transition-all transform hover:-translate-y-1"
                    data-test-id="cta-start-free"
                  >
                    無料で始める
                  </Link>
                </PulseRing>
                <Link
                  href="#demo"
                  className="px-8 py-4 bg-surface border-2 border-border text-foreground rounded-2xl font-bold text-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  デモを見る
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted">
                <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>クレジットカード不要</span>
                </div>
                <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>3分で完成</span>
                </div>
                <div className="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>編集スキル不要</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-surface/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                実際の編集がどう変わるか
              </h2>
              <p className="text-muted text-lg">10分の動画編集が、AI処理で驚きの短時間に</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Before */}
            <ScrollReveal direction="left" delay={0.1}>
              <div className="bg-surface border-2 border-error/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-error/10 text-error rounded-full text-sm font-medium">
                  Before
                </div>
                <div className="mt-8">
                  <div className="text-6xl font-bold text-error mb-4">
                    <CountUp to={10} suffix="分" />
                  </div>
                  <p className="text-muted mb-4">の未編集動画</p>
                  <ul className="space-y-3 text-muted">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-error shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      無音部分が多数存在
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-error shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      「えー」「あー」などのフィラー
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-error shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      テロップは未作成
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>


            {/* After */}
            <ScrollReveal direction="right" delay={0.2}>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-success/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-4 left-4 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                  After
                </div>
                <div className="mt-8">
                  <div className="text-6xl font-bold text-success mb-4">
                    <CountUp to={7} suffix="分" />
                  </div>
                  <p className="text-muted mb-4">AI処理で短縮完了</p>
                  <ul className="space-y-3 text-muted">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      無音・フィラーを自動カット
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      カット位置をマーカーで表示
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      字幕トラック自動生成
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Drag & Drop Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                アップロードするだけで編集完了
              </h2>
              <p className="text-muted text-lg">
                動画をドロップするだけで、AIが自動で編集。試してみてください。
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <ProcessingToEditorDemo />
          </ScrollReveal>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                動画編集の
                <span className="text-error">80%</span>は
                <br />
                <span className="text-4xl md:text-5xl">「単純作業」</span>
              </h2>
              <p className="text-muted text-lg mt-4">
                10分動画に8時間。創造性ゼロ。収益性ゼロ。
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer staggerDelay={0.15} className="space-y-6">
            <StaggerItem>
              <div className="flex items-start gap-4 p-6 bg-error/5 border border-error/20 rounded-2xl">
                <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">テロップ合わせ地獄</h3>
                  <p className="text-muted">タイミングや誤字脱字に神経を使う</p>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="flex items-start gap-4 p-6 bg-error/5 border border-error/20 rounded-2xl">
                <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">演出の時間が取れない</h3>
                  <p className="text-muted">カットで疲弊して演出前に力尽きる</p>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="flex items-start gap-4 p-6 bg-error/5 border border-error/20 rounded-2xl">
                <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">単価が上がらない</h3>
                  <p className="text-muted">作業時間が長くて利益率が低い</p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* AI Agent Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-surface/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-block mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-sm font-medium text-primary">3つのAI機能</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                好きなクリエイターのスタイルを再現
              </h2>
            </div>
          </ScrollReveal>

          <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <div className="bg-surface border border-border rounded-3xl p-8 h-full hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-sm text-primary font-medium mb-2">Feature 01</div>
                <h3 className="text-xl font-bold mb-3">YouTubeスタイル学習</h3>
                <p className="text-muted">
                  URLを入力するだけで、字幕デザイン、カットテンポ、BGM傾向をAIが自動分析。
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-surface border border-border rounded-3xl p-8 h-full hover:border-secondary/50 hover:shadow-xl hover:shadow-secondary/10 transition-all group">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div className="text-sm text-secondary font-medium mb-2">Feature 02</div>
                <h3 className="text-xl font-bold mb-3">自動字幕生成</h3>
                <p className="text-muted">
                  高精度ASRで文字起こし。学習したスタイルで字幕を自動配置。
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-surface border border-border rounded-3xl p-8 h-full hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 transition-all group">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div className="text-sm text-accent font-medium mb-2">Feature 03</div>
                <h3 className="text-xl font-bold mb-3">テンプレート保存</h3>
                <p className="text-muted">
                  学習したスタイルをテンプレートとして保存。いつでも同じ品質で再現できます。
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">3ステップで完成</h2>
              <p className="text-muted text-lg">複雑な操作は一切なし。誰でも簡単に使えます。</p>
            </div>
          </ScrollReveal>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2 z-0" />

            <StaggerContainer staggerDelay={0.2} className="relative z-10">
              <div className="grid md:grid-cols-3 gap-8">
                <StaggerItem>
                  <div className="bg-surface border border-border rounded-3xl p-8 text-center hover:border-primary transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-primary/30">
                      1
                    </div>
                    <h3 className="text-xl font-bold mb-3">動画をアップロード</h3>
                    <p className="text-muted">
                      編集したい素材動画をドラッグ&ドロップするだけ。
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="bg-surface border border-border rounded-3xl p-8 text-center hover:border-secondary transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-secondary/30">
                      2
                    </div>
                    <h3 className="text-xl font-bold mb-3">スタイルを選択</h3>
                    <p className="text-muted">
                      プリセットから選ぶか、YouTube URLで好きなクリエイターのスタイルを学習。
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="bg-surface border border-border rounded-3xl p-8 text-center hover:border-accent transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-accent/30">
                      3
                    </div>
                    <h3 className="text-xl font-bold mb-3">書き出し</h3>
                    <p className="text-muted">
                      AIが自動編集を完了。1080p/4Kで書き出し。
                    </p>
                  </div>
                </StaggerItem>
              </div>
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-background-dark via-[#2a1d15] to-background-dark rounded-3xl p-12 md:p-16 overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  新しい動画編集の形を
                  <br />
                  手に入れよう
                </h2>
                <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
                  事前登録受付中：登録者にはリリース時特典あり
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <PulseRing color="rgba(249, 116, 21, 0.5)">
                    <Link
                      href="/home"
                      className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-primary/50 transition-all transform hover:-translate-y-1"
                    >
                      無料で始める →
                    </Link>
                  </PulseRing>
                </div>
                <p className="mt-6 text-white/50 text-sm">
                  ※ クレジットカード不要・いつでも解約可能
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-lg">{SERVICE_NAME}</span>
            </div>
            <div className="text-muted text-sm">
              © 2026 {SERVICE_NAME}. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
