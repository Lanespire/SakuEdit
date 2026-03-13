/**
 * Freesound API Client
 *
 * デプロイ後にドメイン・callback URL が確定したら有効化する。
 * FREESOUND_API_KEY を .env に設定して、コメントアウトを解除すること。
 * https://freesound.org/apiv2/apply/
 */

export interface FreesoundSearchResult {
  id: number
  name: string
  duration: number
  previewUrl: string
  downloadUrl: string
  license: string
  username: string
  tags: string[]
}

export interface FreesoundSearchOptions {
  query: string
  license?: string
  durationMin?: number
  durationMax?: number
  page?: number
  pageSize?: number
}

// const FREESOUND_BASE = 'https://freesound.org/apiv2'

// function getApiKey(): string {
//   const key = process.env.FREESOUND_API_KEY
//   if (!key) throw new Error('FREESOUND_API_KEY is not set')
//   return key
// }

// function mapResult(item: {
//   id: number
//   name: string
//   duration: number
//   previews?: Record<string, string>
//   download?: string
//   license: string
//   username: string
//   tags: string[]
// }): FreesoundSearchResult {
//   return {
//     id: item.id,
//     name: item.name,
//     duration: item.duration,
//     previewUrl: item.previews?.['preview-hq-mp3'] ?? '',
//     downloadUrl: item.download ?? '',
//     license: item.license,
//     username: item.username,
//     tags: item.tags,
//   }
// }

// export async function searchSounds(
//   options: FreesoundSearchOptions,
// ): Promise<{ results: FreesoundSearchResult[]; count: number }> {
//   const params = new URLSearchParams({
//     query: options.query,
//     token: getApiKey(),
//     fields:
//       'id,name,duration,previews,download,license,username,tags',
//     page_size: String(options.pageSize ?? 15),
//     page: String(options.page ?? 1),
//   })
//
//   const filters: string[] = []
//   const license = options.license ?? 'Creative Commons 0'
//   filters.push(`license:"${license}"`)
//   if (options.durationMin != null) {
//     filters.push(`duration:[${options.durationMin} TO *]`)
//   }
//   if (options.durationMax != null) {
//     filters.push(`duration:[* TO ${options.durationMax}]`)
//   }
//   if (filters.length > 0) {
//     params.set('filter', filters.join(' '))
//   }
//
//   const res = await fetch(`${FREESOUND_BASE}/search/text/?${params}`)
//   if (!res.ok) {
//     throw new Error(`Freesound API error: ${res.status} ${res.statusText}`)
//   }
//
//   const data = await res.json()
//   return {
//     results: (data.results ?? []).map(mapResult),
//     count: data.count ?? 0,
//   }
// }

// export async function getSoundPreview(id: number): Promise<string> {
//   const meta = await getSoundMetadata(id)
//   return meta.previewUrl
// }

// export async function getSoundMetadata(
//   id: number,
// ): Promise<FreesoundSearchResult> {
//   const params = new URLSearchParams({
//     token: getApiKey(),
//     fields:
//       'id,name,duration,previews,download,license,username,tags',
//   })
//
//   const res = await fetch(`${FREESOUND_BASE}/sounds/${id}/?${params}`)
//   if (!res.ok) {
//     throw new Error(`Freesound API error: ${res.status} ${res.statusText}`)
//   }
//
//   const data = await res.json()
//   return mapResult(data)
// }
