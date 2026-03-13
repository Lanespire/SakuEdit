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
  await getVideoBucketClient().send(
    new PutObjectCommand({
      Bucket: getVideoBucketName(),
      Key: objectKey,
      Body: body,
      ContentType: options?.contentType || inferContentType(objectKey),
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
  return createVideoBucketSignedGetUrl(assertProjectAssetObjectKey(storagePath), options)
}

export function getProjectAssetStoragePath(projectId: string, fileName: string) {
  return buildProjectAssetObjectKey(projectId, fileName)
}
