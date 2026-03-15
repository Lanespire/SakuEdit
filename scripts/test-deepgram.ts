/**
 * Deepgram文字起こしテスト
 * Usage: npx tsx scripts/test-deepgram.ts
 */
import 'dotenv/config'
import { isDeepgramConfigured, transcribeWithDeepgram } from '../lib/deepgram-adapter'
import { correctTranscription } from '../lib/ai-text-correction'

async function main() {
  console.log('=== Deepgram文字起こしテスト ===\n')

  // 1. 設定確認
  console.log('1. Deepgram設定確認...')
  if (!isDeepgramConfigured()) {
    console.error('❌ DEEPGRAM_API_KEY が設定されていません')
    process.exit(1)
  }
  console.log('✅ Deepgram APIキー設定済み\n')

  // 2. 文字起こし実行
  const audioPath = '/tmp/sakuedit-test-audio.wav'
  console.log(`2. 文字起こし実行中... (${audioPath})`)
  const startTime = Date.now()

  try {
    const result = await transcribeWithDeepgram(audioPath, 'ja')
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ 文字起こし完了 (${elapsed}秒)\n`)

    console.log(`テキスト全文 (${result.text.length}文字):`)
    console.log(result.text.slice(0, 500))
    if (result.text.length > 500) console.log('...(省略)')
    console.log()

    console.log(`セグメント数: ${result.segments.length}`)
    const showSegments = result.segments.slice(0, 10)
    for (const seg of showSegments) {
      console.log(`  [${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] "${seg.text}" (conf: ${seg.confidence.toFixed(2)})`)
    }
    if (result.segments.length > 10) {
      console.log(`  ... 他${result.segments.length - 10}件`)
    }

    // 3. AI文脈補正テスト
    console.log('\n3. AI文脈補正テスト...')
    const correctionStart = Date.now()
    const corrected = await correctTranscription(
      result.segments.slice(0, 10), // 最初の10セグメントだけテスト
      true, // premium
    )
    const correctionElapsed = ((Date.now() - correctionStart) / 1000).toFixed(1)
    console.log(`✅ AI補正完了 (${correctionElapsed}秒)\n`)

    let correctedCount = 0
    for (const seg of corrected) {
      if (seg.corrected) {
        correctedCount++
        console.log(`  修正: "${seg.original}" → "${seg.text}"`)
      }
    }
    console.log(`  ${correctedCount}/${corrected.length} セグメントを修正`)

    console.log('\n=== テスト成功 ✅ ===')
  } catch (error) {
    console.error('❌ エラー:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
