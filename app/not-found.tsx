import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="text-center">
        <p className="text-6xl font-black text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ページが見つかりません
        </h1>
        <p className="text-gray-500 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  )
}
