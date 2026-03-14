'use client';

import Link from 'next/link';
import { useState } from 'react';

export function LandingMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-600"
        aria-label="メニュー"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg px-4 py-4 space-y-3 z-50">
          <Link href="#how-it-works" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>使い方</Link>
          <Link href="#features" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>機能</Link>
          <Link href="#pricing" className="block text-sm text-gray-700 font-medium" onClick={() => setOpen(false)}>料金</Link>
          <Link href="/home" className="block text-center px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm">
            無料で始める
          </Link>
        </div>
      )}
    </div>
  );
}
