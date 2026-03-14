import { LandingProcessingDemo } from "@/components/LandingProcessingDemo";
import {
  LandingNav,
  LandingHero,
  LandingTrustBar,
  FeatureSilenceCut,
  FeatureSubtitle,
  FeatureThumbnail,
  FeatureSecondary,
  LandingPricing,
  LandingCTA,
  LandingFooter,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <LandingHero />
      <LandingTrustBar />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-primary mb-2 tracking-wide">HOW IT WORKS</p>
            <h2 className="text-2xl sm:text-3xl font-bold">アップロードから編集完了まで、3分</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">
              動画をアップロードすると、無音カット・字幕生成・サムネイル作成が自動で進みます。
              完了後はそのまま微調整して書き出せます。
            </p>
          </div>
          <LandingProcessingDemo />
        </div>
      </section>

      <FeatureSilenceCut />
      <FeatureSubtitle />
      <FeatureThumbnail />
      <FeatureSecondary />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
