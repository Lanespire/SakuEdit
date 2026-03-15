import Link from 'next/link'
import {
  getPlanDefinition,
  PUBLIC_PLAN_IDS,
  type PlanDefinition,
  type PlanId,
} from '@/lib/plans'

type VisiblePlanId = Extract<PlanId, 'free' | 'pro' | 'business' | 'one-time'>

const PLAN_FEATURES: Record<VisiblePlanId, string[]> = {
  free: [
    '月90分まで処理',
    '1本あたり最大10分',
    '720p書き出し',
    '字幕の焼き込み書き出し',
    'ウォーターマーク付き',
  ],
  pro: [
    '月600分まで処理',
    '1本あたり最大30分',
    '1080p書き出し',
    'SRT字幕ファイル',
    'サムネイル生成',
    'ウォーターマークなし',
    'スタイル分析 月10回',
  ],
  business: [
    '月2,400分まで処理',
    '1本あたり最大90分',
    '4K書き出し対応',
    'SRT字幕ファイル',
    'サムネイル生成',
    'ウォーターマークなし',
    'スタイル分析 月50回',
  ],
  'one-time': [
    '永久アクセス（サービス存続中）',
    '月120分まで処理（毎月リセット）',
    '1本あたり最大30分',
    '1080p書き出し',
    '高精度文字起こし（Deepgram）',
    'SRT字幕ファイル',
    'サムネイル生成',
    'ウォーターマークなし',
    'スタイル分析 月5回',
  ],
}

const COMPARISON_ROWS: Array<{
  label: string
  values: [string, string, string, string]
}> = [
  {
    label: '月額',
    values: ['¥0/月', '¥2,480/月', '¥8,980/月', '¥20,000/買い切り'],
  },
  {
    label: '有効期間',
    values: ['無制限', '無制限', '無制限', '永久'],
  },
  {
    label: '処理分数',
    values: ['90分/月', '600分/月', '2,400分/月', '120分/月'],
  },
  {
    label: '1本あたり最大',
    values: ['10分', '30分', '90分', '30分'],
  },
  {
    label: '書き出し品質',
    values: ['720p', '1080p', '4K', '1080p'],
  },
  {
    label: 'SRT書き出し',
    values: ['非対応', '対応', '対応', '対応'],
  },
  {
    label: 'サムネイル生成',
    values: ['非対応', '対応', '対応', '対応'],
  },
  {
    label: 'スタイル分析',
    values: ['非対応', '月10回', '月50回', '月5回'],
  },
  {
    label: 'ウォーターマーク',
    values: ['あり', 'なし', 'なし', 'なし'],
  },
]

const FAQ_ITEMS = [
  {
    q: '無料プランで何ができますか？',
    a: '月90分まで720pで動画処理が可能です。ウォーターマーク付きでの書き出しとなりますが、処理品質を試したい方に最適です。',
  },
  {
    q: '「処理分数」とは何ですか？',
    a: '動画の長さがそのまま消費分数になります。たとえば10分の動画を処理すると10分消費します。4K書き出しの場合は1.5倍消費されます。',
  },
  {
    q: '買い切りパックと月額プランの違いは？',
    a: '買い切りパックは¥20,000の一回払いでサービス存続中ずっと使えます。月120分まで毎月リセットされます。月額プランはより多くの処理分数が必要な方向けです。',
  },
  {
    q: '途中でプラン変更できますか？',
    a: 'いつでもアップグレード可能です。差額は日割り計算で調整されます。',
  },
  {
    q: '支払い方法は？',
    a: 'クレジットカード（Visa / Mastercard / AMEX / JCB）に対応しています。決済はStripeで安全に処理されます。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい、いつでも解約可能です。解約後も次の請求日まで現プランをご利用いただけます。',
  },
  {
    q: '動画の長さに制限はありますか？',
    a: 'プランにより異なります。Freeは10分、Proは30分、Businessは90分、買い切りパックは60分までの動画に対応しています。',
  },
  {
    q: '文字起こしの精度は？',
    a: '無料プランではWhisperを使用します。有料プランおよび買い切りパックではDeepgramの高精度エンジンを使用し、より正確な文字起こしが可能です。',
  },
  {
    q: 'ウォーターマークを消すには？',
    a: 'Pro以上のプランまたは買い切りパックをご利用いただくと、ウォーターマークなしで書き出せます。',
  },
  {
    q: '返金はできますか？',
    a: '処理分数が未使用の場合、購入後7日以内であれば返金に対応いたします。',
  },
]

const BILLING_MESSAGES: Record<string, string> = {
  success: 'Stripe Checkout が完了しました。Webhook 反映後にプランが更新されます。',
  cancelled: 'Checkout をキャンセルしました。',
  'already-active': 'すでに同じプランが有効です。',
}

function PlanCta({ plan }: { plan: PlanDefinition & { popular: boolean } }) {
  const className = `w-full rounded-xl py-3 text-sm font-bold transition-all ${
    plan.popular
      ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
      : 'bg-[#f4ece6] text-[#2d1f18] hover:bg-[#ebe3dc]'
  }`

  if (plan.id === 'free') {
    return (
      <Link href="/auth/signup" className={`${className} block text-center`} data-test-id="cta-free">
        無料で始める
      </Link>
    )
  }

  return (
    <form action="/api/billing/checkout" method="POST">
      <input type="hidden" name="planId" value={plan.id} />
      <button type="submit" className={className} data-test-id={`cta-${plan.id}`}>
        {plan.ctaLabel}
      </button>
    </form>
  )
}

function PlanBadge({ plan }: { plan: { id: PlanId; popular: boolean } }) {
  if (plan.popular) {
    return (
      <div className="mb-4 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
        おすすめ
      </div>
    )
  }
  if (plan.id === 'one-time') {
    return (
      <div className="mb-4 inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        月額不要
      </div>
    )
  }
  return null
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const { billing } = await searchParams
  const visiblePlanIds = PUBLIC_PLAN_IDS.filter(
    (planId) => planId === 'free' || getPlanDefinition(planId).checkoutEnabled,
  ) as VisiblePlanId[]

  const plans = visiblePlanIds.map((planId) => {
    const plan = getPlanDefinition(planId)
    return {
      ...plan,
      popular: plan.id === 'pro',
      features: PLAN_FEATURES[planId],
    }
  })

  const comparisonHeaders = ['Free', 'Pro', 'Business', '買い切りパック']

  return (
    <div className="min-h-screen bg-background-light font-display selection:bg-primary/20">
      <header
        className="sticky top-0 z-50 border-b border-[#f0e6df] bg-white/85 px-6 py-4 backdrop-blur-md"
        data-test-id="pricing-header"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2" data-test-id="header-logo">
            <span className="font-bold text-lg text-[#2d1f18]">SakuEdit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-[#8a756b] transition-colors hover:text-[#2d1f18]"
            >
              LPに戻る
            </Link>
            <Link
              href="/home"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              data-test-id="header-start-button"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-10 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-black leading-tight text-[#2d1f18] md:text-5xl">
            シンプルな料金プラン
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-[#8a756b]">
            あなたの動画制作スタイルに合ったプランをお選びください。すべてのプランで無料トライアルから始められます。
          </p>
        </div>
      </section>

      {billing && BILLING_MESSAGES[billing] && (
        <section className="px-4 pb-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-[#2d1f18]">
            {BILLING_MESSAGES[billing]}
          </div>
        </section>
      )}

      <section className="px-4 pb-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border-2 bg-white p-8 ${
                plan.popular ? 'border-primary shadow-xl shadow-primary/10' : 'border-[#f0e6df]'
              }`}
              data-test-id={`plan-${plan.id}`}
            >
              <PlanBadge plan={plan} />

              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold text-[#2d1f18]">{plan.displayName}</h2>
                <p className="text-sm text-[#8a756b]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-[#2d1f18]">{plan.priceLabel}</span>
                <span className="text-sm text-[#8a756b]">
                  {plan.id === 'one-time' ? '（買い切り）' : plan.periodLabel}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#2d1f18]">
                    <span className="mt-0.5 text-primary">●</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <PlanCta plan={plan} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#eadfd7] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#2d1f18]">機能比較</h2>
              <p className="mt-2 text-sm text-[#8a756b]">
                Free は体験用、Pro は継続利用、Business は長尺と 4K が必要な運用向けです。
              </p>
            </div>
            <p className="text-xs text-[#8a756b]">4K 書き出し時は処理分数を 1.5 倍消費します。</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b border-[#eadfd7] px-4 py-3 text-left text-sm font-bold text-[#8a756b]">
                    項目
                  </th>
                  {comparisonHeaders.map((header) => (
                    <th
                      key={header}
                      className="border-b border-[#eadfd7] px-4 py-3 text-left text-sm font-bold text-[#2d1f18]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="border-b border-[#f4ece6] px-4 py-3 text-sm font-medium text-[#5f4d42]">
                      {row.label}
                    </td>
                    {row.values.map((value, idx) => (
                      <td key={`${row.label}-${idx}`} className="border-b border-[#f4ece6] px-4 py-3 text-sm text-[#2d1f18]">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#2d1f18]">よくある質問</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-[#f0e6df] bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-bold text-[#2d1f18] [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-[#8a756b] transition-transform group-open:rotate-180">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-[#8a756b]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#f0e6df] px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#8a756b]">
            <Link href="/terms" className="hover:text-[#2d1f18]">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-[#2d1f18]">
              プライバシーポリシー
            </Link>
            <Link href="/commercial-transactions" className="hover:text-[#2d1f18]">
              特定商取引法に基づく表記
            </Link>
          </div>
          <p className="text-sm text-[#8a756b]">&copy; 2026 SakuEdit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
