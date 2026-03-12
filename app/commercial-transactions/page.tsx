import Link from 'next/link'
import {
  LEGAL_BILLING_SUMMARY,
  LEGAL_CONTACT_NOTE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_SERVICE_ENVIRONMENT,
} from '@/lib/legal'

export default function CommercialTransactionsPage() {
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
          <h1 className="text-3xl font-bold text-[#2d1f18] dark:text-white">特定商取引法に基づく表記</h1>
          <p className="text-sm text-[#8a756b] dark:text-[#bdaea4]">最終更新日: {LEGAL_LAST_UPDATED}</p>
          <p className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
            本ページは、{LEGAL_ENTITY.serviceName} の有料プランおよび関連サービスについて、
            特定商取引法に基づく表示事項を掲載するものです。
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#eadfd7] bg-white/85 shadow-sm dark:border-[#3a2a20] dark:bg-[#231810]/80">
          <dl className="divide-y divide-[#eadfd7] dark:divide-[#3a2a20]">
            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">販売事業者</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">{LEGAL_ENTITY.operatorName}</dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">運営責任者</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">{LEGAL_ENTITY.representative}</dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">所在地</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                〒{LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.address}
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">お問い合わせ先</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                お問い合わせフォーム:{' '}
                <a
                  href={LEGAL_ENTITY.contactUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {LEGAL_ENTITY.contactUrl}
                </a>
                <br />
                {LEGAL_CONTACT_NOTE}
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">販売価格</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                <ul className="list-disc space-y-2 pl-5">
                  {LEGAL_BILLING_SUMMARY.map((plan) => (
                    <li key={plan.id}>
                      {plan.name}: {plan.priceLabel}
                      <span className="text-[#8a756b] dark:text-[#bdaea4]">（{plan.description}）</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  詳細な機能差、最新の価格、キャンペーン適用の有無は
                  <Link href="/pricing" className="text-primary hover:underline"> 料金ページ </Link>
                  に表示します。
                </p>
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">商品代金以外の必要料金</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                インターネット接続料金、通信料金、動画アップロードおよびダウンロードに要する費用はユーザーの負担です。銀行振込等を個別に案内した場合の振込手数料その他の実費もユーザー負担となります。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">支払方法</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                クレジットカードその他当社または決済代行事業者が本サービス上で別途定める方法により支払うものとします。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">支払時期</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                有料プランは申込時に課金が確定し、以後は各契約期間の更新日に自動で課金されます。引落時期は契約するカード会社その他の決済事業者の定めによります。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">役務の提供時期</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                本サービスは、申込および決済完了後、直ちに利用可能となります。動画の編集結果、字幕生成結果、書き出しデータ等は、各処理完了後に提供されます。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">更新・解約</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                有料プランは自動更新です。解約を希望する場合は、次回更新日までに当社所定の方法で手続を行ってください。解約後は次回更新日以降の課金を停止し、契約期間満了まで利用できます。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">返品・返金</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                デジタルサービスの性質上、法令上必要な場合または当社が別途認める場合を除き、申込完了後の返品、キャンセルおよび返金には応じません。ただし、当社の責めに帰すべき事由により本サービスが長期間利用できなかった場合は、この限りではありません。
              </dd>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="text-sm font-bold text-[#2d1f18] dark:text-white">動作環境</dt>
              <dd className="text-sm leading-7 text-[#5f4d42] dark:text-[#d1c5be]">
                <ul className="list-disc space-y-2 pl-5">
                  {LEGAL_SERVICE_ENVIRONMENT.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="text-primary hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/pricing" className="text-primary hover:underline">
            料金ページ
          </Link>
        </div>
      </div>
    </div>
  )
}
