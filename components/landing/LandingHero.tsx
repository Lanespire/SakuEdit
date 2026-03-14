import Link from "next/link";

export function LandingHero() {
  return (
    <section className="pt-16 sm:pt-20 pb-8 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium text-primary mb-4 tracking-wide">
          YouTube・SNS動画の編集を、もっとラクに
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.12] mb-5">
          動画を上げたら、
          <br />
          <span className="text-primary">編集は終わっている</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
          アップロード後に無音カット・字幕生成・サムネイル作成まで一気に処理。
          <br className="hidden sm:block" />
          必要なところだけ手直しして、すぐに公開できます。
        </p>
        <div className="mb-3">
          <Link
            href="/home"
            className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
            data-test-id="cta-start-free"
          >
            無料で試してみる
          </Link>
        </div>
        <p className="text-gray-500 text-sm">クレジットカード不要 ・ 月90分まで無料</p>
      </div>
    </section>
  );
}
