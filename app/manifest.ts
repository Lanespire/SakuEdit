import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SakuEdit - AI動画編集ツール',
    short_name: 'SakuEdit',
    description: '動画を上げたら、編集は終わっている。AI自動編集ツール。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF6B35',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
