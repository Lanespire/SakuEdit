import { NextRequest } from 'next/server'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import prisma from '@/lib/db'
import {
  buildProjectWorkingDir,
  materializeProjectAsset,
} from '@/lib/server/project-storage'
import {
  badRequest,
  forbidden,
  getRequiredUserId,
  handleRoute,
  notFound,
  ok,
  parseJson,
} from '@/lib/server/route'

const extractFramesSchema = z.object({
  projectId: z.string().min(1),
  timestamps: z.array(z.number().min(0)).min(1).max(10),
})

/**
 * FFmpegで指定タイムスタンプのフレームを抽出
 */
async function extractFrame(
  inputPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-ss', timestamp.toFixed(3),
      '-i', inputPath,
      '-frames:v', '1',
      '-vf', 'scale=1280:-2',
      '-q:v', '2',
      '-y',
      outputPath,
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let stderrOutput = ''

    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderrOutput += data.toString()
    })

    ffmpeg.on('close', (code: number | null) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(
            `FFmpegフレーム抽出失敗 (code ${code}): ${stderrOutput.slice(-200)}`
          )
        )
      }
    })

    ffmpeg.on('error', (err: Error) => {
      reject(new Error(`FFmpeg起動失敗: ${err.message}`))
    })
  })
}

export const POST = handleRoute(
  async (request: NextRequest) => {
    const userId = await getRequiredUserId(request, { allowTestUserId: true })
    const body = await parseJson(request, extractFramesSchema)

    // プロジェクト・動画確認
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      include: { videos: { take: 1 } },
    })
    if (!project) notFound('プロジェクトが見つかりません')
    if (project.userId !== userId) forbidden()

    const video = project.videos[0]
    if (!video?.storagePath) {
      badRequest('動画ファイルが見つかりません')
    }

    const framesDir = buildProjectWorkingDir(body.projectId, 'frames')
    await fs.rm(framesDir, { recursive: true, force: true }).catch(() => undefined)
    await fs.mkdir(framesDir, { recursive: true })

    try {
      const inputPath = await materializeProjectAsset(video.storagePath, {
        projectId: body.projectId,
        fileName: `input${path.extname(video.filename || video.storagePath) || '.mp4'}`,
        workDir: framesDir,
      })

      // 各タイムスタンプのフレームを抽出
      const frames = []
      for (const timestamp of body.timestamps) {
        const filename = `frame_${timestamp.toFixed(3).replace('.', '_')}.jpg`
        const outputPath = path.join(framesDir, filename)

        try {
          await extractFrame(inputPath, outputPath, timestamp)
          const buffer = await fs.readFile(outputPath)
          const base64 = buffer.toString('base64')

          frames.push({
            timestamp,
            imageUrl: `data:image/jpeg;base64,${base64}`,
            base64,
          })
        } catch (error) {
          console.error(
            `フレーム抽出失敗 (${timestamp}s):`,
            error instanceof Error ? error.message : error
          )
          // 失敗したフレームはスキップ
        }
      }

      if (frames.length === 0) {
        badRequest('フレーム抽出に失敗しました')
      }

      return ok({ frames })
    } finally {
      await fs.rm(framesDir, { recursive: true, force: true }).catch(() => undefined)
    }
  },
  { onError: 'フレーム抽出に失敗しました' }
)
