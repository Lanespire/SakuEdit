import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import {
  createVideoBucketSignedGetUrl,
  getVideoBucketClient,
  getVideoBucketName,
} from './video-bucket'

function inferContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()

  switch (extension) {
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.webm':
      return 'video/webm'
    case '.wav':
      return 'audio/wav'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.srt':
      return 'text/plain; charset=utf-8'
    case '.json':
      return 'application/json'
    default:
      return 'application/octet-stream'
  }
}

export function buildProjectAssetObjectKey(projectId: string, fileName: string) {
  return `projects/${projectId}/${fileName}`
}

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), 'uploads')
const LOCAL_STORAGE_MIRROR_ROOTS = [
  LOCAL_STORAGE_ROOT,
  path.join(process.cwd(), '.open-next/server-functions/default/uploads'),
]
const DEFAULT_VIDEO_BUCKET_REGION = 'ap-northeast-1'

export function buildProcessingArtifactObjectKey(
  projectId: string,
  pipelineVersion: string,
  fileName: string,
) {
  return buildProjectAssetObjectKey(projectId, `artifacts/${pipelineVersion}/${fileName}`)
}

export function buildProjectWorkingDir(projectId: string, scope: string = 'processing') {
  return path.join(tmpdir(), 'sakuedit', scope, projectId)
}

export function assertProjectAssetObjectKey(storagePath: string | null | undefined) {
  if (!storagePath) {
    throw new Error('Project asset storagePath is required')
  }

  if (
    path.isAbsolute(storagePath) ||
    storagePath.startsWith('./') ||
    storagePath.startsWith('../') ||
    !storagePath.startsWith('projects/')
  ) {
    throw new Error(`Project asset must be an S3 object key: ${storagePath}`)
  }

  return storagePath
}

async function ensureRemoteProjectAssetStorageEnv() {
  if (process.env.VIDEO_BUCKET_NAME && process.env.VIDEO_BUCKET_REGION) {
    return true
  }

  try {
    const outputsPath = path.join(process.cwd(), '.sst', 'outputs.json')
    const raw = await fs.readFile(outputsPath, 'utf-8')
    const outputs = JSON.parse(raw) as { bucketName?: string }

    if (!process.env.VIDEO_BUCKET_NAME && outputs.bucketName) {
      process.env.VIDEO_BUCKET_NAME = outputs.bucketName
    }

    if (!process.env.VIDEO_BUCKET_REGION) {
      process.env.VIDEO_BUCKET_REGION = DEFAULT_VIDEO_BUCKET_REGION
    }

    return Boolean(process.env.VIDEO_BUCKET_NAME && process.env.VIDEO_BUCKET_REGION)
  } catch {
    return false
  }
}

export function hasRemoteProjectAssetStorage() {
  return Boolean(process.env.VIDEO_BUCKET_NAME || process.env.VIDEO_BUCKET_REGION)
}

function getLocalStoragePath(objectKey: string, root: string = LOCAL_STORAGE_ROOT) {
  return path.join(root, objectKey)
}

async function statIfExists(filePath: string) {
  try {
    return await fs.stat(filePath)
  } catch {
    return null
  }
}

export async function resolveLocalProjectAssetPath(
  storagePath: string,
  options?: {
    projectId?: string
    fileName?: string
    expectedSize?: number | null
  },
) {
  const objectKey = assertProjectAssetObjectKey(storagePath)
  const fileName = options?.fileName || path.basename(objectKey)
  const candidatePaths = Array.from(
    new Set([
      ...LOCAL_STORAGE_MIRROR_ROOTS.map((root) => getLocalStoragePath(objectKey, root)),
      ...(options?.projectId
        ? [path.join(LOCAL_STORAGE_ROOT, 'projects', options.projectId, fileName)]
        : []),
      path.join(process.cwd(), fileName),
      path.join(process.cwd(), path.basename(objectKey)),
    ]),
  )

  let fallbackMatch: string | null = null

  for (const candidatePath of candidatePaths) {
    const stats = await statIfExists(candidatePath)
    if (!stats?.isFile()) {
      continue
    }

    if (options?.expectedSize && stats.size === options.expectedSize) {
      return candidatePath
    }

    fallbackMatch ??= candidatePath
  }

  return fallbackMatch
}

export async function writeProjectAsset(
  projectId: string,
  fileName: string,
  body: Buffer | Uint8Array | string,
  options?: { contentType?: string },
) {
  const objectKey = buildProjectAssetObjectKey(projectId, fileName)
  await writeStorageObject(objectKey, body, {
    contentType: options?.contentType || inferContentType(fileName),
  })

  return objectKey
}

export async function writeStorageObject(
  objectKey: string,
  body: Buffer | Uint8Array | string,
  options?: { contentType?: string },
) {
  const contentType = options?.contentType || inferContentType(objectKey)
  const localPath = getLocalStoragePath(objectKey)
  const normalizedBody = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body)

  await fs.mkdir(path.dirname(localPath), { recursive: true })
  await fs.writeFile(localPath, normalizedBody)

  if (!(await ensureRemoteProjectAssetStorageEnv())) {
    return
  }

  await getVideoBucketClient().send(
    new PutObjectCommand({
      Bucket: getVideoBucketName(),
      Key: objectKey,
      Body: normalizedBody,
      ContentType: contentType,
    }),
  )
}

export async function uploadLocalProjectAsset(
  projectId: string,
  fileName: string,
  localPath: string,
  options?: { contentType?: string },
) {
  const body = await fs.readFile(localPath)
  return writeProjectAsset(projectId, fileName, body, options)
}

export async function uploadLocalStorageObject(
  objectKey: string,
  localPath: string,
  options?: { contentType?: string },
) {
  const body = await fs.readFile(localPath)
  await writeStorageObject(objectKey, body, options)
  return objectKey
}

export async function materializeProjectAsset(
  storagePath: string,
  options: { projectId: string; fileName?: string; workDir?: string },
) {
  const objectKey = assertProjectAssetObjectKey(storagePath)
  const fileName = options.fileName || path.basename(objectKey)
  const workDir = options.workDir || buildProjectWorkingDir(options.projectId)
  await fs.mkdir(workDir, { recursive: true })

  const localPath = path.join(workDir, fileName)
  const cachedPath = await resolveLocalProjectAssetPath(storagePath, {
    projectId: options.projectId,
    fileName,
  })

  if (cachedPath) {
    await fs.copyFile(cachedPath, localPath)
    return localPath
  }

  if (!(await ensureRemoteProjectAssetStorageEnv())) {
    throw new Error(`Project asset is not available locally and remote storage is not configured: ${objectKey}`)
  }

  const response = await getVideoBucketClient().send(
    new GetObjectCommand({
      Bucket: getVideoBucketName(),
      Key: objectKey,
    }),
  )

  const bytes = await response.Body?.transformToByteArray()
  if (!bytes) {
    throw new Error(`Failed to download project asset: ${objectKey}`)
  }

  await fs.writeFile(localPath, bytes)
  return localPath
}

export async function resolveProjectAssetUrl(
  storagePath: string,
  options?: { expiresInSeconds?: number; fileName?: string; contentType?: string },
) {
  if (!(await ensureRemoteProjectAssetStorageEnv())) {
    throw new Error('Remote project asset storage is not configured')
  }

  return createVideoBucketSignedGetUrl(assertProjectAssetObjectKey(storagePath), options)
}

export async function createLocalAssetResponse(
  request: Request,
  filePath: string,
  options?: { contentType?: string; cacheControl?: string },
) {
  const fileStats = await fs.stat(filePath)
  const fileSize = fileStats.size
  const contentType = options?.contentType || inferContentType(filePath)
  const rangeHeader = request.headers.get('range')

  if (rangeHeader) {
    const [startToken, endToken] = rangeHeader.replace(/bytes=/, '').split('-')
    const start = Number.parseInt(startToken, 10)
    const end = endToken ? Number.parseInt(endToken, 10) : fileSize - 1

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end < start ||
      start >= fileSize
    ) {
      return new Response('Requested range not satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
      })
    }

    const safeEnd = Math.min(end, fileSize - 1)
    const chunkSize = safeEnd - start + 1
    const fileHandle = await fs.open(filePath, 'r')

    try {
      const buffer = Buffer.allocUnsafe(chunkSize)
      await fileHandle.read(buffer, 0, chunkSize, start)

      return new Response(new Uint8Array(buffer), {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${safeEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': options?.cacheControl || 'private, max-age=0, must-revalidate',
          'Cross-Origin-Resource-Policy': 'same-origin',
        },
      })
    } finally {
      await fileHandle.close()
    }
  }

  const fileHandle = await fs.open(filePath, 'r')

  try {
    const buffer = Buffer.allocUnsafe(fileSize)
    await fileHandle.read(buffer, 0, fileSize, 0)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': options?.cacheControl || 'private, max-age=0, must-revalidate',
        'Cross-Origin-Resource-Policy': 'same-origin',
      },
    })
  } finally {
    await fileHandle.close()
  }
}

export function getProjectAssetStoragePath(projectId: string, fileName: string) {
  return buildProjectAssetObjectKey(projectId, fileName)
}
