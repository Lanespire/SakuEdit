import useSWR, { type SWRConfiguration } from 'swr'
import { readJsonSafely } from '@/lib/client/http'

export async function swrFetcher<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input)

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`)
  }

  const payload = await readJsonSafely<T>(response)

  if (!payload) {
    throw new Error('レスポンスの解析に失敗しました')
  }

  return payload
}

export { useSWR, type SWRConfiguration }
