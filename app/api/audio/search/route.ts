import { NextResponse } from 'next/server'
// import { searchSounds } from '@/lib/freesound-client'

/**
 * Freesound SE 検索プロキシ
 *
 * デプロイ後にドメイン・callback URL が確定したら有効化する。
 * FREESOUND_API_KEY を .env に設定し、lib/freesound-client.ts と合わせてコメントアウト解除すること。
 */

export async function GET() {
  return NextResponse.json(
    { error: 'Freesound API は現在無効です。デプロイ後に有効化してください。', results: [] },
    { status: 503 },
  )
}

// export async function GET_ENABLED(request: NextRequest) {
//   const params = request.nextUrl.searchParams
//   const query = params.get('q')
//
//   if (!query) {
//     return NextResponse.json(
//       { error: 'クエリパラメータ q が必要です' },
//       { status: 400 },
//     )
//   }
//
//   try {
//     const results = await searchSounds({
//       query,
//       license: params.get('license') ?? undefined,
//       durationMin: params.get('durationMin')
//         ? Number(params.get('durationMin'))
//         : undefined,
//       durationMax: params.get('durationMax')
//         ? Number(params.get('durationMax'))
//         : undefined,
//       page: params.get('page') ? Number(params.get('page')) : undefined,
//       pageSize: params.get('pageSize')
//         ? Number(params.get('pageSize'))
//         : undefined,
//     })
//     return NextResponse.json(results)
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : 'Unknown error'
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }
