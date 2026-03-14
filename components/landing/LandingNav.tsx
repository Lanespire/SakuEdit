import Image from "next/image";
import Link from "next/link";
import { LandingMobileNav } from "@/components/LandingMobileNav";
import { SERVICE_NAME } from "@/lib/constants";

export function LandingNav() {
  return (
    <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-2" data-test-id="header-logo">
            <Image src="/logo.svg" alt={`${SERVICE_NAME} ロゴ`} width={32} height={32} />
            <span className="text-xl font-bold">{SERVICE_NAME}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">使い方</Link>
            <Link href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">機能</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" data-test-id="header-pricing-link">料金</Link>
            <Link href="/home" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors" data-test-id="landing-start-editing-button">
              無料で始める
            </Link>
          </div>
          <LandingMobileNav />
        </div>
      </div>
    </nav>
  );
}
