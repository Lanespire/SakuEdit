import type { Metadata } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
})

export const metadata: Metadata = {
  title: 'SakuEdit - AI動画編集ツール',
  description:
    '急いで動画編集したい人・編集分からない人でもサクッと編集できる。参考動画のスタイルをAIが学習し、字幕・カット・テンポを自動で再現します。',
  keywords: ['動画編集', 'AI', '字幕', 'YouTuber', 'スタイル分析'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-background-light dark:bg-background-dark text-[#1c130d] dark:text-white`}
      >
        {children}
      </body>
    </html>
  )
}
