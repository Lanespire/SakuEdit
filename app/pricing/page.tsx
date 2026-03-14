import Link from 'next/link'
import {
  getPlanDefinition,
  ONE_TIME_PACK_SUGGESTION,
  PUBLIC_PLAN_IDS,
  type PlanDefinition,
  type PlanId,
} from '@/lib/plans'

type PublicPlanId = Extract<PlanId, 'free' | 'pro' | 'business'>

const PLAN_FEATURES: Record<PublicPlanId, string[]> = {
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
}

const COMPARISON_ROWS: Array<{
  label: string
  render: (plan: PlanDefinition) => string
}> = [
  {
    label: '月額',
    render: (plan) =>
      plan.monthlyPriceYen === null ? '個別見積もり' : `${plan.priceLabel}${plan.periodLabel}`,
  },
  {
    label: '月間処理分数',
    render: (plan) => `${plan.monthlyProcessingMinutes}分`,
  },
  {
    label: '1本あたり最大',
    render: (plan) => `${plan.maxSingleVideoMinutes}分`,
  },
  {
    label: '書き出し品質',
    render: (plan) => plan.maxQuality,
  },
  {
    label: 'SRT書き出し',
    render: (plan) => (plan.hasSrtExport ? '対応' : '非対応'),
  },
  {
    label: 'サムネイル生成',
    render: (plan) => (plan.hasThumbnail ? '対応' : '非対応'),
  },
  {
    label: 'スタイル分析',
    render: (plan) =>
      plan.monthlyStyleAnalysisCount > 0 ? `月${plan.monthlyStyleAnalysisCount}回` : '非対応',
  },
  {
    label: 'ウォーターマーク',
    render: (plan) => (plan.hasWatermark ? 'あり' : 'なし'),
  },
]

const BILLING_MESSAGES: Record<string, string> = {
  success: 'Stripe Checkout が完了しました。Webhook 反映後にプランが更新されます。',
  cancelled: 'Checkout をキャンセルしました。',
  'already-active': 'すでに同じプランが有効です。',
}

function PlanCta({ planId, label, popular }: { planId: PublicPlanId; label: string; popular: boolean }) {
  const className = `w-full rounded-xl py-3 text-sm font-bold transition-all ${
    popular
      ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
      : 'bg-[#f4ece6] text-[#2d1f18] hover:bg-[#ebe3dc]'
  }`

  if (planId === 'free') {
    return (
      <Link href="/auth/signup" className={`${className} block text-center`} data-test-id="cta-free">
        無料で始める
      </Link>
    )
  }

  return (
    <form action="/api/billing/checkout" method="POST">
      <input type="hidden" name="planId" value={planId} />
      <button type="submit" className={className} data-test-id={`cta-${planId}`}>
        {label}
      </button>
    </form>
  )
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const { billing } = await searchParams
  const visiblePlanIds = PUBLIC_PLAN_IDS.filter(
    (planId) => planId === 'free' || getPlanDefinition(planId).checkoutEnabled,
  ) as PublicPlanId[]

  const plans = visiblePlanIds.map((planId) => {
    const plan = getPlanDefinition(planId)
    return {
      ...plan,
      popular: plan.id === 'pro',
      features: PLAN_FEATURES[planId],
    }
  })

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
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
            今ある機能だけで比較
          </span>
          <h1 className="mb-4 text-4xl font-black leading-tight text-[#2d1f18] md:text-5xl">
            シンプルな料金プラン
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-[#8a756b]">
            いま比較できるのは、処理分数、書き出し品質、SRT、サムネイル生成です。
            優先キューやチーム共有は現時点では提供していないため、料金表から外しています。
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border-2 bg-white p-8 ${
                plan.popular ? 'border-primary shadow-xl shadow-primary/10' : 'border-[#f0e6df]'
              }`}
              data-test-id={`plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="mb-4 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  おすすめ
                </div>
              )}

              <div className="mb-6">
                <h2 className="mb-2 text-xl font-bold text-[#2d1f18]">{plan.displayName}</h2>
                <p className="text-sm text-[#8a756b]">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-[#2d1f18]">{plan.priceLabel}</span>
                <span className="text-sm text-[#8a756b]">{plan.periodLabel}</span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#2d1f18]">
                    <span className="mt-0.5 text-primary">●</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <PlanCta planId={plan.id as PublicPlanId} label={plan.ctaLabel} popular={plan.popular} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#eadfd7] bg-white p-6 shadow-sm">
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
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="border-b border-[#eadfd7] px-4 py-3 text-left text-sm font-bold text-[#2d1f18]"
                    >
                      {plan.displayName}
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
                    {plans.map((plan) => (
                      <td key={`${row.label}-${plan.id}`} className="border-b border-[#f4ece6] px-4 py-3 text-sm text-[#2d1f18]">
                        {row.render(plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f4] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <span className="mb-3 inline-block rounded-full bg-[#2d1f18] px-3 py-1 text-xs font-bold text-white">
              設計案
            </span>
            <h2 className="text-2xl font-bold text-[#2d1f18]">買い切り型はこの価格なら成立しやすいです</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f4d42]">
              月額に入るほどではない単発案件向けには、サブスクより割高な買い切りパックが自然です。
              1回の購入で数本まとめて仕上げられ、継続利用者は Pro に流れる価格差を維持できます。
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-[#eadfd7] bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#2d1f18]">{ONE_TIME_PACK_SUGGESTION.displayName}</h3>
                  <p className="mt-2 text-sm text-[#8a756b]">{ONE_TIME_PACK_SUGGESTION.description}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  準備中
                </span>
              </div>

              <div className="mb-5">
                <span className="text-4xl font-black text-[#2d1f18]">{ONE_TIME_PACK_SUGGESTION.priceLabel}</span>
                <span className="text-sm text-[#8a756b]">{ONE_TIME_PACK_SUGGESTION.periodLabel}</span>
              </div>

              <ul className="space-y-3 text-sm text-[#2d1f18]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">●</span>
                  <span>{ONE_TIME_PACK_SUGGESTION.processingMinutes}分まで処理</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">●</span>
                  <span>{ONE_TIME_PACK_SUGGESTION.validDays}日有効</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">●</span>
                  <span>1本あたり最大{ONE_TIME_PACK_SUGGESTION.maxSingleVideoMinutes}分</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">●</span>
                  <span>{ONE_TIME_PACK_SUGGESTION.maxQuality}書き出し</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary">●</span>
                  <span>SRT書き出し・サムネイル生成込み</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#eadfd7] bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#2d1f18]">価格の考え方</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5f4d42]">
                <li>月額 Pro より割高にして、継続利用は Pro に寄せます。</li>
                <li>Free の延長ではなく、単発案件を完了させるための上位体験として設計します。</li>
                <li>4K、優先処理、チーム共有は含めず、実装済み機能だけを束ねます。</li>
                <li>有効期限を 30 日に切ると、買い溜め用途を防ぎやすくなります。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#2d1f18]">よくある質問</h2>
          <div className="space-y-4">
            {[
              {
                q: 'SRT書き出しはできますか？',
                a: 'はい。Pro と Business では SRT を別ファイルで書き出せます。Free は動画への焼き込みのみです。',
              },
              {
                q: '優先キューやチーム共有はありますか？',
                a: '現時点では提供していません。料金表や LP でもその訴求は外しています。',
              },
              {
                q: 'どのプランから始めるのがよいですか？',
                a: 'まずは Free で処理品質を確認し、SRT やサムネイルが必要になったら Pro へ上げるのが自然です。',
              },
              {
                q: '買い切り型はすぐ使えますか？',
                a: 'まだ準備中です。まずは月額プランを提供し、需要が見えたら買い切りパックを追加する前提です。',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[#f0e6df] bg-white p-6">
                <h3 className="mb-2 font-bold text-[#2d1f18]">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-[#8a756b]">{faq.a}</p>
              </div>
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
          <p className="text-sm text-[#8a756b]">© 2026 SakuEdit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
