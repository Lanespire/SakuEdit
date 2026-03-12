import Link from 'next/link'
import { LEGAL_CONTACT_NOTE, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '@/lib/legal'

const dataCategories = [
  'アカウント情報: メールアドレス、表示名、認証に必要な情報',
  '契約・決済関連情報: 契約プラン、請求状況、決済に紐づく識別子',
  'ユーザーコンテンツ: アップロードした動画、音声、字幕、スタイル設定、プロジェクト情報、参考動画URL',
  '利用状況情報: ログ、アクセス履歴、リクエスト情報、処理状況、エラー情報、Cookieまたはこれに類する識別子',
  'お問い合わせ情報: お問い合わせフォーム等で受領する氏名、会社名、メールアドレス、問い合わせ内容',
] as const

const usePurposes = [
  '本サービスへの登録受付、本人確認、認証、アカウント管理のため',
  '動画編集支援、スタイル分析、字幕生成、書き出し、課金管理その他本サービス提供のため',
  '料金請求、決済処理、不正利用防止、障害対応、問い合わせ対応のため',
  '本サービスの品質向上、機能改善、利用状況分析、セキュリティ監視のため',
  '法令遵守、権利保護、紛争対応その他正当な事業運営のため',
] as const

const processors = [
  'better-auth / Prisma: 認証、セッション管理、アカウント情報管理',
  'Stripe: 決済、請求、サブスクリプション管理',
  'Amazon Web Services: インフラ運用、動画データ保存、処理基盤の提供',
  'Deepgram: 音声認識および文字起こし処理',
  'OpenRouter 経由の生成AIモデル: スタイル分析、字幕生成その他AI補助機能',
] as const

const rights = [
  '利用目的の通知または開示',
  '保有個人データの開示',
  '内容の訂正、追加または削除',
  '利用停止、消去または第三者提供の停止',
] as const

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          ← トップページに戻る
        </Link>

        <div className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold text-[#2d1f18] dark:text-white">プライバシーポリシー</h1>
          <p className="text-sm text-[#8a756b] dark:text-[#bdaea4]">最終更新日: {LEGAL_LAST_UPDATED}</p>
          <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
            {LEGAL_ENTITY.operatorName}（以下「当社」といいます。）は、
            {` ${LEGAL_ENTITY.serviceName} `}
            における個人情報およびユーザーデータを、個人情報の保護に関する法律その他の関係法令に従って取り扱います。
          </p>
        </div>

        <div className="space-y-8 rounded-3xl border border-[#eadfd7] bg-white/85 p-8 shadow-sm dark:border-[#3a2a20] dark:bg-[#231810]/80">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">1. 取得する情報</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              {dataCategories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">2. 利用目的</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、取得した情報を次の目的のために利用します。
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              {usePurposes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">3. 外部委託および第三者サービス</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、本サービスの提供に必要な範囲で、次の事業者その他の委託先に情報処理を委託することがあります。
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              {processors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              これらの委託先は、日本国外に所在し、または日本国外のサーバーでデータを処理する場合があります。当社は、委託先の提供内容、所在国またはサーバー設置国に関する情報把握に努め、契約上および運用上必要な安全管理措置を講じます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">4. 第三者提供</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、法令に基づく場合、人の生命・身体・財産の保護に必要な場合、業務委託に伴い必要な範囲で提供する場合その他法令上認められる場合を除き、本人の同意なく個人データを第三者に提供しません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">5. Cookie等の利用</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、ログイン状態の維持、セキュリティ対策、利用状況の把握、障害調査その他本サービスの安定運用のためにCookieまたはこれに類する技術を利用することがあります。ブラウザ設定によりCookieを無効化した場合、本サービスの一部機能が利用できないことがあります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">6. 安全管理措置</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、個人データへの不正アクセス、漏えい、滅失または毀損の防止その他個人データの安全管理のため、アクセス権限管理、認証管理、通信の暗号化、委託先管理、ログ監視その他必要かつ適切な措置を講じます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">7. 保有個人データに関する請求</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、法令に基づき、本人またはその代理人から次の請求を受けた場合、合理的な範囲で対応します。
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              {rights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">8. お問い合わせ窓口</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              事業者名: {LEGAL_ENTITY.operatorName}
              <br />
              代表者: {LEGAL_ENTITY.representative}
              <br />
              所在地: 〒{LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.address}
              <br />
              お問い合わせフォーム:{' '}
              <a
                href={LEGAL_ENTITY.contactUrl}
                className="text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {LEGAL_ENTITY.contactUrl}
              </a>
            </p>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              {LEGAL_CONTACT_NOTE}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#2d1f18] dark:text-white">9. 改定</h2>
            <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
              当社は、法令の改正またはサービス内容の変更に応じて、本ポリシーを改定することがあります。重要な変更がある場合は、本サービス上または当社ウェブサイト上で周知します。
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            利用規約
          </Link>
          <Link href="/commercial-transactions" className="text-primary hover:underline">
            特定商取引法に基づく表記
          </Link>
          <Link href="/pricing" className="text-primary hover:underline">
            料金ページ
          </Link>
        </div>
      </div>
    </div>
  )
}
