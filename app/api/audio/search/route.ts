import { NextRequest, NextResponse } from 'next/server'
import { searchSounds } from '@/lib/freesound-client'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = params.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'クエリパラメータ q が必要です' },
      { status: 400 },
    )
  }

  try {
    const results = await searchSounds({
      query,
      license: params.get('license') ?? undefined,
      durationMin: params.get('durationMin')
        ? Number(params.get('durationMin'))
        : undefined,
      durationMax: params.get('durationMax')
        ? Number(params.get('durationMax'))
        : undefined,
      page: params.get('page') ? Number(params.get('page')) : undefined,
      pageSize: params.get('pageSize')
        ? Number(params.get('pageSize'))
        : undefined,
    })
    return NextResponse.json(results)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
