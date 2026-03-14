'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex items-center justify-center px-4 bg-white font-sans">
        <div className="text-center">
          <p className="text-6xl font-black text-[#FF6B35] mb-4">500</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-gray-500 mb-8">
            申し訳ありません。問題が発生しました。
          </p>
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  )
}
