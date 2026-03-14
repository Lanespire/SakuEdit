import { CheckIcon } from "./CheckIcon";

export function LandingTrustBar() {
  return (
    <section className="py-5 px-4 border-y border-gray-200 bg-gray-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>日本語音声を解析して<strong className="text-gray-900">タイムコード付き字幕</strong>を生成</span>
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
  );
}
