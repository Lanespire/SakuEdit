import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          ← トップページに戻る
        </Link>
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground/80">
          <p>最終更新日: 2026年3月1日</p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. 収集する情報</h2>
          <p>本サービスでは以下の情報を収集します：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>アカウント情報（メールアドレス、表示名）</li>
            <li>アップロードされた動画データ</li>
            <li>サービス利用ログ（処理履歴、アクセスログ）</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">2. 情報の利用目的</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>動画編集サービスの提供・改善</li>
            <li>ユーザーサポートの提供</li>
            <li>サービスの安全性確保</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. 動画データの取り扱い</h2>
          <p>
            アップロードされた動画は処理完了後、一定期間保存された後に自動削除されます。
            動画データを第三者に提供・販売することはありません。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">4. 第三者サービスの利用</h2>
          <p>
            音声認識・AI分析のため、以下の外部サービスを利用する場合があります。
            各サービスのプライバシーポリシーも合わせてご確認ください。
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deepgram（音声認識）</li>
            <li>OpenRouter（AI分析）</li>
            <li>Stripe（決済処理）</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">5. データの保護</h2>
          <p>
            適切な技術的・組織的措置を講じてお客様のデータを保護します。
            通信はSSL/TLSにより暗号化されます。
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. お問い合わせ</h2>
          <p>
            プライバシーに関するお問い合わせは、サポート窓口までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}
