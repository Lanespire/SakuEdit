'use client';

import dynamic from 'next/dynamic';

const ProcessingToEditorDemo = dynamic(
  () => import('@/components/ProcessingToEditorDemo').then((mod) => mod.ProcessingToEditorDemo),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full min-h-[600px] rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-h-[600px] items-center justify-center text-sm text-gray-500">
          デモを読み込み中...
        </div>
      </div>
    ),
  },
);

export function LandingProcessingDemo() {
  return <ProcessingToEditorDemo />;
}
