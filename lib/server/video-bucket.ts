import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Resource } from 'sst'

const ONE_HOUR_IN_SECONDS = 60 * 60

let s3Client: S3Client | null = null

function readLinkedBucketName() {
  const linkedResources = Resource as unknown as Record<string, { name?: string } | undefined>
  return linkedResources.VideoBucket?.name
}

export function getVideoBucketName() {
  const bucketName = process.env.VIDEO_BUCKET_NAME || readLinkedBucketName()

  if (!bucketName) {
    throw new Error('Video bucket is not configured')
  }

  return bucketName
}

export function getAwsRegion() {
  const region = process.env.AWS_REGION

  if (!region) {
    throw new Error('AWS region is not configured')
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
