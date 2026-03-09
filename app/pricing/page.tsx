import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '¥0',
      period: '/月',
      description: 'まずは品質を試したい方に',
      features: [
        { text: '月90分まで処理', included: true },
        { text: '1本あたり最大10分', included: true },
        { text: '720p書き出し', included: true },
        { text: 'ウォーターマーク付き', included: true },
        { text: 'プリセットスタイル 3種', included: true },
        { text: '字幕生成', included: true },
        { text: '無音カット', included: true },
        { text: '1080p書き出し', included: false },
        { text: 'スタイル学習（参考動画）', included: false },
        { text: 'SRT字幕ファイル', included: false },
        { text: 'サムネイル生成', included: false },
        { text: 'ウォーターマークなし', included: false },
      ],
      cta: '無料で始める',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '¥2,480',
      period: '/月',
      description: '継続的に動画制作する個人向け',
      features: [
        { text: '月600分まで処理', included: true },
        { text: '1本あたり最大30分', included: true },
        { text: '1080p書き出し', included: true },
        { text: 'ウォーターマークなし', included: true },
        { text: 'スタイル保存 20件', included: true },
        { text: '字幕生成', included: true },
        { text: '無音カット', included: true },
        { text: 'スタイル学習 月10本', included: true },
        { text: 'SRT字幕ファイル', included: true },
        { text: 'サムネイル生成', included: true },
        { text: '優先処理', included: true },
        { text: '4K書き出し', included: false },
      ],
      cta: 'Proを始める',
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: '¥8,980',
      period: '/月',
      description: '運用フェーズの個人・少人数チーム向け',
      features: [
        { text: '月2,400分まで処理', included: true },
        { text: '1本あたり最大90分', included: true },
        { text: '1080p書き出し', included: true },
        { text: 'ウォーターマークなし', included: true },
        { text: 'スタイル保存 100件', included: true },
        { text: '字幕生成', included: true },
        { text: '無音カット', included: true },
        { text: 'スタイル学習 月50本', included: true },
        { text: 'SRT字幕ファイル', included: true },
        { text: 'サムネイル生成', included: true },
        { text: '優先キュー', included: true },
        { text: 'チーム共有 3席まで', included: true },
      ],
      cta: 'Businessを始める',
      popular: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '要相談',
      period: '',
      description: '大量処理・4K・SLAが必要な法人向け',
      features: [
        { text: '月3,000分超の処理枠を個別設計', included: true },
        { text: '4K書き出し', included: true },
        { text: '専用キュー / SLA相談', included: true },
        { text: 'ウォーターマークなし', included: true },
        { text: 'スタイル学習回数を個別設定', included: true },
        { text: 'SRT字幕ファイル', included: true },
        { text: 'サムネイル生成', included: true },
        { text: 'チーム共有・権限制御', included: true },
        { text: '請求書払い対応', included: true },
        { text: '導入支援', included: true },
        { text: '超過利用の従量設計', included: true },
        { text: '無制限固定額', included: false },
      ],
      cta: 'お問い合わせ',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/95 backdrop-blur-md border-b border-[#f0e6df] px-6 py-4" data-test-id="pricing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2" data-test-id="header-logo">
            <span className="text-2xl">🎬</span>
            <span className="font-bold text-lg text-[#2d1f18] dark:text-white">SakuEdit</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            data-test-id="header-start-button"
          >
            今すぐ始める
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold mb-4">
            ✨ 処理分数ベースで明朗会計
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#2d1f18] dark:text-white mb-4 leading-tight">
            シンプルな料金プラン
          </h1>
          <p className="text-lg text-[#8a756b] dark:text-[#9e8b7d] max-w-2xl mx-auto">
            本数ではなく、月間の処理分数で使える量を明確化しています。
            いつでもアップグレード・キャンセルできます。
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-[#2a1d15] rounded-2xl border-2 p-8 flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-xl shadow-primary/10'
                    : 'border-[#f0e6df] dark:border-[#3a2a20]'
                }`}
                data-test-id={`plan-${plan.id}`}
              >
                {/* Plan card content */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-full shadow-lg">
                    人気No.1
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#2d1f18] dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-[#8a756b]">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black text-[#2d1f18] dark:text-white">{plan.price}</span>
                  <span className="text-[#8a756b] text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[#d0c0b6] text-[20px]">cancel</span>
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? 'text-[#2d1f18] dark:text-white'
                            : 'text-[#b0a096] line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.popular
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                      : 'bg-[#f4ece6] dark:bg-white/10 text-[#2d1f18] dark:text-white hover:bg-[#ebe3dc] dark:hover:bg-white/20'
                  }`}
                  data-test-id={`cta-${plan.id}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-[#faf7f4] dark:bg-[#1f1610]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2d1f18] dark:text-white mb-8">
            よくある質問
          </h2>
          <div className="space-y-4">
            {[
              {
                q: '無料プランの制限は何ですか？',
                a: '無料プランは月90分まで、1本あたり最大10分です。書き出しは720pでウォーターマーク付きです。',
              },
              {
                q: 'いつでもキャンセルできますか？',
                a: 'はい、いつでもキャンセル可能です。キャンセル後も当月末までプランをご利用いただけます。',
              },
              {
                q: 'なぜ本数ではなく処理分数ベースなのですか？',
                a: '動画の長さによって処理負荷が大きく変わるためです。分数ベースの方が、使える量と料金の関係がわかりやすく、サービス側も安定運用しやすくなります。',
              },
              {
                q: '上限を超えたらどうなりますか？',
                a: '現時点では上位プランへのアップグレードをご案内します。Enterpriseでは超過利用を含めた個別設計にも対応します。',
              },
              {
                q: '4K書き出しはどのプランで使えますか？',
                a: '4K書き出しはEnterpriseで個別対応します。Free / Pro / Business は1080pまでを前提に設計しています。',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#2a1d15] rounded-xl p-6 border border-[#f0e6df] dark:border-[#3a2a20]"
              >
                <h3 className="font-bold text-[#2d1f18] dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-[#8a756b] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[#f0e6df] dark:border-[#3a2a20]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-[#8a756b]">© 2026 SakuEdit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
