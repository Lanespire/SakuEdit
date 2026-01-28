import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SakuEdit
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted hover:text-foreground transition-colors">
                機能
              </Link>
              <Link href="#how-it-works" className="text-muted hover:text-foreground transition-colors">
                使い方
              </Link>
              <Link href="#pricing" className="text-muted hover:text-foreground transition-colors">
                料金
              </Link>
              <Link
                href="/home"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                今すぐ始める
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-surface border border-border rounded-full">
            <span className="text-sm text-muted">✨ AI搭載の次世代動画編集</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              この人みたいな動画、
            </span>
            <br />
            <span className="text-foreground">作れます。</span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            YouTube URLを指定するだけで、憧れのクリエイターの編集スタイルをAIが学習。
            <br />
            あなたの動画に、プロの編集技術を自動適用。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/home"
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/50 transition-all transform hover:-translate-y-1"
            >
              無料で始める
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 bg-surface border border-border text-foreground rounded-xl font-bold text-lg hover:bg-surface-hover transition-all"
            >
              デモを見る
            </Link>
          </div>

          <div className="mt-16 flex justify-center gap-8 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              クレジットカード不要
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              3分で完成
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              編集スキル不要
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">なぜSakuEditなのか？</h2>
            <p className="text-muted text-lg">プロの編集を、誰でも、すぐに。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface border border-border rounded-2xl p-8 hover:border-primary transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">AIスタイル学習</h3>
              <p className="text-muted">
                YouTube URLを入力するだけで、字幕スタイル、カットテンポ、BGM傾向をAIが自動分析。
              </p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-8 hover:border-secondary transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">自動字幕生成</h3>
              <p className="text-muted">
                Whisper APIで正確な文字起こし。学習したスタイルで字幕を自動配置。
              </p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-8 hover:border-accent transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">直感的エディター</h3>
              <p className="text-muted">
                タイムライン編集、字幕調整、スタイル微調整をリアルタイムプレビューで確認。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">3ステップで完成</h2>
            <p className="text-muted text-lg">複雑な操作は一切なし。誰でも簡単に使えます。</p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">動画をアップロード</h3>
                <p className="text-muted text-lg">
                  編集したい素材動画をドラッグ&ドロップするだけ。
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">スタイルを選択</h3>
                <p className="text-muted text-lg">
                  プリセットから選ぶか、YouTube URLで好きなクリエイターのスタイルを学習。
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">書き出し</h3>
                <p className="text-muted text-lg">
                  AIが自動編集を完了。エディターで微調整して、1080p/4Kで書き出し。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            今すぐ始めよう
          </h2>
          <p className="text-xl text-muted mb-8">
            無料プランで、まずは試してみてください。
          </p>
          <Link
            href="/home"
            className="inline-block px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-primary/50 transition-all transform hover:-translate-y-1"
          >
            無料で始める →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
              <span className="font-bold text-lg">SakuEdit</span>
            </div>
            <div className="text-muted text-sm">
              © 2026 SakuEdit. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
