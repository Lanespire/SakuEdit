import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          ← トップページに戻る
        </Link>
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground/80">
          <p>最終更新日: 2026年3月1日</p>

          <h2 className="text-xl font-bold mt-8 mb-4">第1条（適用）</h2>
          <p>
            本利用規約（以下「本規約」）は、SakuEdit（以下「本サービス」）の利用に関する条件を定めるものです。
            ユーザーは本規約に同意の上、本サービスを利用するものとします。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">第2条（アカウント）</h2>
          <p>
            ユーザーは正確な情報を提供してアカウントを登録し、自己の責任において管理するものとします。
            アカウントの不正利用による損害について、当社は責任を負いません。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">第3条（サービス内容）</h2>
          <p>
            本サービスは、AI技術を活用した動画編集支援ツールを提供します。
            サービスの内容は予告なく変更される場合があります。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">第4条（禁止事項）</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>サービスの運営を妨害する行為</li>
            <li>不正アクセスまたはそれを試みる行為</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">第5条（料金）</h2>
          <p>
            有料プランの料金は料金ページに記載のとおりです。
            キャンセルは月末まで有効で、翌月から課金が停止されます。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">第6条（免責事項）</h2>
          <p>
            本サービスは「現状有姿」で提供されます。AI処理の結果について完全性・正確性を保証するものではありません。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">第7条（規約の変更）</h2>
          <p>
            当社は必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載された時点で効力を生じます。
          </p>
        </div>
      </div>
    </div>
  )
}
