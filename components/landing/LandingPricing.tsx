import Link from "next/link";
import { CheckIcon } from "./CheckIcon";
import { getPlanDefinition } from "@/lib/plans";

export function LandingPricing() {
  const freePlan = getPlanDefinition("free");
  const proPlan = getPlanDefinition("pro");

  const plans = [
    {
      id: freePlan.id,
      name: freePlan.displayName,
      audience: "まず試してみたい方",
      price: freePlan.priceLabel,
      period: freePlan.periodLabel,
      href: "/auth/signup",
      ctaLabel: freePlan.ctaLabel,
      emphasized: false,
      features: [
        `月${freePlan.monthlyProcessingMinutes}分まで処理`,
        `1本あたり最大${freePlan.maxSingleVideoMinutes}分`,
        `${freePlan.maxQuality}書き出し`,
        "ウォーターマーク付き",
      ],
    },
    {
      id: proPlan.id,
      name: proPlan.displayName,
      audience: "継続的に動画制作する個人向け",
      price: proPlan.priceLabel,
      period: proPlan.periodLabel,
      href: "/pricing",
      ctaLabel: "詳細を見る",
      emphasized: true,
      features: [
        `月${proPlan.monthlyProcessingMinutes}分まで処理`,
        `1本あたり最大${proPlan.maxSingleVideoMinutes}分`,
        `${proPlan.maxQuality}書き出し`,
        "SRT書き出し・サムネイル生成",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 px-4 bg-gray-50"
      data-test-id="pricing-section"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">
            まずは Free と Pro から
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 ${plan.emphasized ? "relative bg-white border-2 border-primary shadow-lg shadow-primary/10" : "bg-white border border-gray-200"}`}
            >
              {plan.emphasized && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                  おすすめ
                </div>
              )}
              <p className="text-sm font-bold text-gray-900 mb-1">
                {plan.name}
              </p>
              <p className="text-xs text-gray-500 mb-3">{plan.audience}</p>
              <p className="text-3xl font-bold mb-4">
                {plan.price}
                <span className="text-sm font-normal text-gray-400">
                  {plan.period}
                </span>
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center px-4 py-2.5 rounded-xl text-sm transition-colors ${plan.emphasized ? "bg-primary text-white font-bold hover:bg-primary-dark" : "border border-gray-200 text-gray-900 font-semibold hover:border-gray-400"}`}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-500"
          >
            料金を詳しく見る
          </Link>
        </div>
      </div>
    </section>
  );
}
