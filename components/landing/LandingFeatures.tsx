import Image from "next/image";
import { CheckIcon } from "./CheckIcon";

const SILENCE_WAVE = [
  35, 60, 48, 75, 55, 68, 8, 4, 6, 3, 5, 3, 72, 85, 58, 42, 78, 62, 50, 5, 3, 4,
  2, 68, 55, 80, 45, 72, 60, 48, 75, 55, 68, 42, 8, 3, 5, 4, 6, 72, 85, 58, 78,
  62, 50, 68, 55, 80, 45, 72,
];

export function FeatureSilenceCut() {
  return (
    <section id="features" className="py-16 sm:py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 order-2 md:order-1 shadow-sm" data-test-id="feature-silence-cut">
            <div className="flex items-end gap-[2px] h-32 sm:h-40">
              {SILENCE_WAVE.map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-sm transition-colors ${h < 10 ? "bg-red-400/60" : "bg-gray-900/15"}`} style={{ height: `${h}%` }} />
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
          <div className="order-1 md:order-2">
            <p className="text-sm font-semibold text-primary mb-2 tracking-wide">SILENCE CUT</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">無音・フィラーを<br />自動でカット</h2>
            <p className="text-gray-600 leading-relaxed">
              「えー」「あー」や無音区間を0.3秒単位で検出して自動カット。
              手作業で数時間かかるカット編集が、アップロードするだけで完了します。
              カット箇所は後から個別に調整できます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureSubtitle() {
  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-primary mb-2 tracking-wide">SUBTITLE</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">字幕を自動生成、<br />スタイルも選べる</h2>
            <p className="text-gray-600 leading-relaxed">
              日本語音声を解析して字幕を自動生成。
              タイムコード付きで、フォント・サイズ・色などのスタイルも後から変更できます。
            </p>
          </div>
          <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-gray-800 shadow-sm" data-test-id="feature-subtitle">
            <div className="relative aspect-[16/10]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a3e] to-[#15152a]" />
              <div className="absolute top-4 left-4 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400/70" />
                <span className="text-[10px] text-white/30 font-mono">REC 01:23:15</span>
              </div>
              <div className="absolute bottom-6 left-0 right-0 px-6 space-y-2">
                <div className="text-center">
                  <span className="inline-block bg-white/90 text-[#1a1a2e] px-4 py-2 rounded-lg text-sm sm:text-base font-bold shadow-sm">今日はプログラミングの話をします</span>
                </div>
                <div className="flex justify-center gap-2">
                  <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded border border-white/10">白背景</span>
                  <span className="text-[10px] bg-primary/20 text-primary/70 px-2 py-0.5 rounded border border-primary/20">ブランドカラー</span>
                  <span className="text-[10px] bg-black/30 text-white/50 px-2 py-0.5 rounded border border-white/10">シンプル</span>
                </div>
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
  );
}

export function FeatureThumbnail() {
  return (
    <section className="py-16 sm:py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 order-2 md:order-1 shadow-sm" data-test-id="feature-thumbnail">
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-video rounded-xl border-2 border-primary/40 relative overflow-hidden">
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10">
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
                <Image src="/thumbnails/thumb-selected.png" alt="サムネイル候補1" fill className="object-cover" sizes="25vw" />
              </div>
              <div className="aspect-video rounded-xl border border-gray-200 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/thumbnails/thumb-alt1.png" alt="サムネイル候補2" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="aspect-video rounded-xl border border-gray-700 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/thumbnails/thumb-alt2.png" alt="サムネイル候補3" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="aspect-video rounded-xl border border-gray-200 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/thumbnails/thumb-alt3.png" alt="サムネイル候補4" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>4候補から選択</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <p className="text-sm font-semibold text-primary mb-2 tracking-wide">THUMBNAIL</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">サムネイルも<br />この画面で完結</h2>
            <p className="text-gray-600 leading-relaxed">
              テンプレートを選ぶか、動画のフレームから自動生成。
              複数の候補から選ぶだけで、Canvaなどの別ツールを開く必要がなくなります。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureSecondary() {
  const features = [
    { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "blue", title: "チャットで編集指示", desc: "「字幕を大きくして」「BGMを追加して」— チャットで指示するだけで編集を反映。" },
    { icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "amber", title: "テンポ自動調整", desc: "カット間隔を自動で整えて、テンポの良い動画に仕上がります。" },
    { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "purple", title: "スタイル分析", desc: "参考動画を取り込むと、編集スタイルを分析して再現できます。" },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">さらにできること</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors">
              <div className={`w-10 h-10 bg-${f.color}-50 rounded-lg flex items-center justify-center mb-4`}>
                <svg className={`w-5 h-5 text-${f.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
