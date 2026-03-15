/**
 * E2Eフローテスト
 * アップロード → 処理（Deepgram文字起こし + AI補正） → エクスポート
 * Usage: npx tsx scripts/test-e2e-flow.ts
 */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import prisma from '../lib/db'
import { enqueueProjectProcessing } from '../lib/server/processing-jobs'
import { runProjectProcessing } from '../lib/process-project'

const BASE_URL = 'http://localhost:3000'
const TEST_USER_ID = 'lIz64F2XN1Edi8hbaJyyKPHoYQNJR6oJ'
const VIDEO_PATH = path.join(process.cwd(), 'video.mp4')

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== SakuEdit E2Eフローテスト ===\n')

  // 1. ファイル存在確認
  try {
    await fs.access(VIDEO_PATH)
    const stat = await fs.stat(VIDEO_PATH)
    console.log(`✅ video.mp4 確認済み (${(stat.size / 1024 / 1024).toFixed(1)}MB)\n`)
  } catch {
    console.error('❌ video.mp4 が見つかりません')
    process.exit(1)
  }

  // 2. プロジェクト作成（直接DB）
  console.log('2. プロジェクト作成...')
  const project = await (prisma as any).project.create({
    data: {
      userId: TEST_USER_ID,
      name: 'e2e-test-' + Date.now(),
      status: 'UPLOADING',
    },
  })
  const projectId = project.id
  console.log(`✅ プロジェクト作成 (projectId: ${projectId})\n`)

  // 3. アップロード
  console.log('3. 動画アップロード中...')
  const fileBuffer = await fs.readFile(VIDEO_PATH)
  const formData = new FormData()
  formData.append('file', new Blob([fileBuffer], { type: 'video/mp4' }), 'video.mp4')
  formData.append('projectId', projectId)
  formData.append('autoProcess', 'false')

  const uploadRes = await fetch(`${BASE_URL}/api/upload?testUserId=${TEST_USER_ID}`, {
    method: 'POST',
    body: formData,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.error(`❌ アップロード失敗 (${uploadRes.status}): ${err}`)
    process.exit(1)
  }

  console.log(`✅ アップロード成功\n`)

  // 4. 処理実行（直接呼び出し：Deepgram + AI補正）
  console.log('4. 動画処理中（Deepgram + AI補正）...')
  const { job } = await enqueueProjectProcessing({
    projectId,
    userId: TEST_USER_ID,
  })
  console.log(`  ジョブ作成: ${job.id}`)

  try {
    const result = await runProjectProcessing({ jobId: job.id })
    if (!result.success) {
      console.error(`❌ 処理失敗: ${JSON.stringify(result)}`)
      process.exit(1)
    }
    console.log(`✅ 処理完了`)
    console.log(`  字幕数: ${result.subtitles?.length ?? 0}`)
    console.log(`  長さ: ${result.duration?.toFixed(1)}秒\n`)
  } catch (error) {
    console.error(`❌ 処理エラー: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }

  // 6. 字幕確認
  console.log('6. 字幕確認...')
  const subtitlesRes = await fetch(`${BASE_URL}/api/projects/${projectId}/subtitles?testUserId=${TEST_USER_ID}`)
  if (subtitlesRes.ok) {
    const subtitlesData = await subtitlesRes.json()
    const subtitles = subtitlesData.subtitles ?? []
    console.log(`✅ ${subtitles.length}件の字幕`)
    for (const sub of subtitles.slice(0, 5)) {
      console.log(`  [${sub.startTime?.toFixed(1)}s - ${sub.endTime?.toFixed(1)}s] "${sub.text}"`)
    }
    if (subtitles.length > 5) console.log(`  ... 他${subtitles.length - 5}件`)
  } else {
    console.log('⚠️ 字幕取得失敗')
  }
  console.log()

  // 7. エクスポート
  console.log('7. 動画書き出し...')
  const exportRes = await fetch(`${BASE_URL}/api/export?testUserId=${TEST_USER_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      quality: '720p',
      format: 'mp4',
      subtitleOption: 'burn',
    }),
  })

  if (!exportRes.ok) {
    const err = await exportRes.text()
    console.error(`❌ エクスポート失敗 (${exportRes.status}): ${err}`)
    console.log('  ※ エクスポートはS3/Remotionレンダリング環境が必要な場合があります')
  } else {
    const exportData = await exportRes.json()
    console.log(`✅ エクスポート成功`)
    console.log(`  ダウンロードURL: ${exportData.downloadUrl}`)
    console.log(`  課金秒数: ${exportData.billing?.chargedSeconds}s`)
  }

  console.log('\n=== E2Eテスト完了 ===')
}

main().catch((error) => {
  console.error('テスト失敗:', error)
  process.exit(1)
})
