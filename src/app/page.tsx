import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 p-6">
      <main className="flex w-full max-w-4xl flex-col items-center text-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-6">
          <h1 className="text-6xl font-extrabold tracking-tight sm:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2">
            Stitch
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            動画制作をもっと自由に、もっとクリエイティブに。<br className="hidden sm:block" />
            あなたのアイデアを形にするための最高のツールです。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md justify-center">
          <Link
            href="/projects/new"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <span className="relative z-10">新しい動画を作成</span>
          </Link>
          <Link
            href="/projects"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-8 py-4 text-lg font-bold text-gray-900 shadow-xl ring-1 ring-gray-900/10 transition-all hover:bg-gray-50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-900 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
          >
            <span className="relative z-10">作成した動画を見る</span>
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-6 text-sm text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} Stitch
      </footer>
    </div>
  );
}