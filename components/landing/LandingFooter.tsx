import Image from "next/image";
import Link from "next/link";
import { SERVICE_NAME } from "@/lib/constants";

export function LandingCTA() {
  return (
    <section className="py-16 sm:py-20 px-4" data-test-id="final-cta">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">まずは1本、無料で試してみませんか</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">月90分まで無料で自動編集できます。アカウント登録は30秒で完了します。</p>
        <Link href="/home" className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">
          無料で始める
        </Link>
        <p className="mt-4 text-gray-500 text-sm">クレジットカード不要</p>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt={`${SERVICE_NAME} ロゴ`} width={24} height={24} />
          <span className="font-semibold text-sm">{SERVICE_NAME}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">プライバシーポリシー</Link>
          <Link href="/commercial-transactions" className="hover:text-gray-700 transition-colors">特定商取引法</Link>
        </div>
        <span className="text-xs text-gray-400">&copy; 2026 {SERVICE_NAME}</span>
      </div>
    </footer>
  );
}
