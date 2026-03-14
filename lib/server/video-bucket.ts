import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ONE_HOUR_IN_SECONDS = 60 * 60

let s3Client: S3Client | null = null
let cachedSstOutputs: { bucketName?: string } | null | undefined

function getSstOutputs() {
  if (cachedSstOutputs !== undefined) {
    return cachedSstOutputs
  }

  const outputsPath = path.join(process.cwd(), '.sst', 'outputs.json')
  if (!existsSync(outputsPath)) {
    cachedSstOutputs = null
    return cachedSstOutputs
  }

  try {
    const parsed = JSON.parse(readFileSync(outputsPath, 'utf-8')) as { bucketName?: string }
    cachedSstOutputs = parsed
    return cachedSstOutputs
  } catch {
    cachedSstOutputs = null
    return cachedSstOutputs
  }
}

export function getVideoBucketName() {
  const bucketName =
    process.env.VIDEO_BUCKET_NAME ||
    (process.env.NODE_ENV === 'development' ? getSstOutputs()?.bucketName : undefined)

  if (!bucketName) {
    throw new Error('VIDEO_BUCKET_NAME is required')
  }

  return bucketName
}

export function getAwsRegion() {
  const region =
    process.env.VIDEO_BUCKET_REGION ||
    process.env.AWS_REGION ||
    (process.env.NODE_ENV === 'development' ? 'ap-northeast-1' : undefined)

  if (!region) {
    throw new Error('VIDEO_BUCKET_REGION is required')
  }

  return region
}

export function getVideoBucketClient() {
  if (!s3Client) {
    s3Client = new S3Client({ region: getAwsRegion() })
  }

  return s3Client
}

function inferContentTypeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.webm':
      return 'video/webm'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.srt':
      return 'text/plain; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

export async function uploadFileToVideoBucket(
  localPath: string,
  objectKey: string,
  options?: { contentType?: string },
) {
  const bucketName = getVideoBucketName()
  const body = await readFile(localPath)

  await getVideoBucketClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: body,
      ContentType: options?.contentType || inferContentTypeFromPath(localPath),
    }),
  )

  return { bucketName, objectKey }
}

export async function uploadTextToVideoBucket(
  objectKey: string,
  body: string,
  options?: { contentType?: string },
) {
  const bucketName = getVideoBucketName()

  await getVideoBucketClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: body,
      ContentType: options?.contentType || 'text/plain; charset=utf-8',
    }),
  )

  return { bucketName, objectKey }
}

export async function createVideoBucketSignedGetUrl(
  objectKey: string,
  options?: { expiresInSeconds?: number; fileName?: string; contentType?: string },
) {
  const bucketName = getVideoBucketName()
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ...(options?.fileName
      ? {
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(options.fileName)}"`,
        }
      : {}),
    ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
  })

  return getSignedUrl(getVideoBucketClient(), command, {
    expiresIn: options?.expiresInSeconds ?? ONE_HOUR_IN_SECONDS,
  })
}
