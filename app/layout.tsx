import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SakuEdit - AI動画編集ツール',
    template: '%s | SakuEdit',
  },
  description:
    '急いで動画編集したい人・編集分からない人でもサクッと編集できる。参考動画のスタイルをAIが学習し、字幕・カット・テンポを自動で再現します。',
  keywords: ['動画編集', 'AI', '字幕', 'YouTuber', 'スタイル分析', '無音カット', '自動編集'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'SakuEdit',
    title: 'SakuEdit - 動画を上げたら、編集は終わっている',
    description: 'アップロード後に無音カット・字幕生成・サムネイル作成まで一気に処理。必要なところだけ手直しして、すぐに公開できます。',
    images: [
      {
        url: '/ogp.png',
        width: 1424,
        height: 752,
        alt: 'SakuEdit - AI動画編集ツールのエディタ画面',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SakuEdit - 動画を上げたら、編集は終わっている',
    description: 'アップロード後に無音カット・字幕生成・サムネイル作成まで一気に処理。',
    images: ['/ogp.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://sakuedit.com'),
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
        className="font-sans antialiased bg-background-light dark:bg-background-dark text-[#1c130d] dark:text-white"
      >
        {children}
      </body>
    </html>
  )
}
