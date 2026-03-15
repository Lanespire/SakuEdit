import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Mocks ----------

const mockPrisma = {
  project: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  video: {
    create: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}))

vi.mock('@/lib/server/processing-jobs', () => ({
  enqueueProjectProcessing: vi.fn().mockResolvedValue({
    job: { id: 'job-1' },
    shouldInvoke: false,
  }),
}))

vi.mock('@/lib/server/processing-dispatch', () => ({
  dispatchProcessingJobOrMarkFailure: vi.fn(),
}))

vi.mock('@/lib/server/project-storage', () => ({
  uploadLocalStorageObject: vi.fn().mockResolvedValue('s3://projects/p1/input.mp4'),
  writeProjectAsset: vi.fn().mockResolvedValue('s3://projects/p1/input.mp4'),
}))

vi.mock('@/lib/video-processor', () => ({
  downloadFromYouTube: vi.fn(),
}))

// ---------- Helpers ----------

const BASE = 'http://localhost:3000'
const TEST_USER = 'test-user-upload'

function makeUploadRequest(formFields: Record<string, string | Blob>) {
  const url = new URL('/api/upload', BASE)
  url.searchParams.set('testUserId', TEST_USER)

  const formData = new FormData()
  for (const [key, value] of Object.entries(formFields)) {
    formData.append(key, value)
  }

  return new NextRequest(url, {
    method: 'POST',
    body: formData,
  })
}

function createMockFile(
  name: string,
  size: number,
  type: string,
): File {
  const buffer = new ArrayBuffer(Math.min(size, 1024))
  return new File([buffer], name, { type })
}

// ---------- Tests ----------

describe('POST /api/upload', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/upload/route')
    POST = mod.POST
  })

  it('ファイルなし・URLなしで400', async () => {
    const req = makeUploadRequest({ projectId: 'p1' })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('No file provided')
  })

  it('無効なファイルタイプで400', async () => {
    const file = createMockFile('test.txt', 100, 'text/plain')

    const req = makeUploadRequest({
      file,
      projectId: 'p1',
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain('Invalid file type')
  })

  it('projectIdなしで400', async () => {
    const file = createMockFile('video.mp4', 100, 'video/mp4')

    const req = makeUploadRequest({ file })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Project ID is required')
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)

    const file = createMockFile('video.mp4', 100, 'video/mp4')

    const req = makeUploadRequest({
      file,
      projectId: 'nonexistent',
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Project not found')
  })

  it('ファイルアップロードが成功する', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' })
    mockPrisma.video.create.mockResolvedValue({
      id: 'v1',
      projectId: 'p1',
      filename: 'video.mp4',
    })
    mockPrisma.project.update.mockResolvedValue({ id: 'p1' })

    const file = createMockFile('video.mp4', 1024, 'video/mp4')

    const req = makeUploadRequest({
      file,
      projectId: 'p1',
      autoProcess: 'false',
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.video).toBeDefined()
    expect(json.status).toBe('uploaded')
  })

  it('URLアップロードでprojectIdなしで400', async () => {
    const req = makeUploadRequest({
      url: 'https://youtube.com/watch?v=test',
      sourceType: 'youtube',
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Project ID is required for URL uploads')
  })

  it('URLアップロードで存在しないプロジェクトで404', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)

    const req = makeUploadRequest({
      url: 'https://youtube.com/watch?v=test',
      sourceType: 'youtube',
      projectId: 'nonexistent',
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Project not found')
  })

  it('認証なしで401', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const url = new URL('/api/upload', BASE)
    // No testUserId
    const formData = new FormData()
    formData.append('projectId', 'p1')
    const req = new NextRequest(url, { method: 'POST', body: formData })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
