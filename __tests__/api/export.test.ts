import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Mocks ----------

const mockPrisma = {
  project: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  exportJob: {
    create: vi.fn(),
    update: vi.fn(),
  },
  usageLog: {
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

const mockGetBillingSnapshot = vi.fn()
const mockValidateExportAccess = vi.fn()
const mockCalculateExportChargeSeconds = vi.fn()

vi.mock('@/lib/billing', () => ({
  getBillingSnapshot: (...args: unknown[]) => mockGetBillingSnapshot(...args),
  validateExportAccess: (...args: unknown[]) => mockValidateExportAccess(...args),
  calculateExportChargeSeconds: (...args: unknown[]) => mockCalculateExportChargeSeconds(...args),
}))

vi.mock('@/lib/editor', () => ({
  getPlaybackSegments: vi.fn().mockReturnValue([]),
  normalizeSilenceRegions: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/remotion-captions-adapter', () => ({
  serializeSegmentsToSrt: vi.fn().mockReturnValue(''),
}))

vi.mock('@/lib/rve-state', () => ({
  extractPersistedExportState: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/server/video-bucket', () => ({
  uploadFileToVideoBucket: vi.fn(),
  uploadTextToVideoBucket: vi.fn(),
  createVideoBucketSignedGetUrl: vi.fn().mockResolvedValue('https://signed-url.example.com/video'),
}))

vi.mock('@/lib/video-processor', () => ({
  renderWithRemotion: vi.fn().mockResolvedValue({ success: true }),
  generateThumbnail: vi.fn().mockResolvedValue({ success: true }),
}))

// ---------- Helpers ----------

const BASE = 'http://localhost:3000'
const TEST_USER = 'test-user-export'

function makeRequest(body: unknown) {
  const url = new URL('/api/export', BASE)
  url.searchParams.set('testUserId', TEST_USER)

  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function setupDefaultMocks() {
  mockGetBillingSnapshot.mockResolvedValue({
    plan: {
      id: 'free',
      maxSingleVideoMinutes: 10,
      hasWatermark: true,
      hasThumbnail: false,
      hasSrtExport: false,
    },
    remainingSeconds: 5400,
    usedSeconds: 0,
  })
  mockValidateExportAccess.mockReturnValue(null)
  mockCalculateExportChargeSeconds.mockReturnValue(60)

  mockPrisma.project.findUnique.mockResolvedValue({
    id: 'p1',
    userId: TEST_USER,
    compositionData: null,
    style: null,
    subtitles: [],
    aiSuggestions: [],
    videos: [
      {
        id: 'v1',
        storagePath: 'projects/p1/input.mp4',
        duration: 60,
        width: 1920,
        height: 1080,
        mimeType: 'video/mp4',
        silenceDetected: null,
      },
    ],
  })

  mockPrisma.exportJob.create.mockResolvedValue({ id: 'ej1' })
  mockPrisma.exportJob.update.mockResolvedValue({
    id: 'ej1',
    status: 'COMPLETED',
    videoUrl: '/api/export/p1/ej1/video',
    srtUrl: null,
    thumbnailUrl: null,
  })
  mockPrisma.project.update.mockResolvedValue({ id: 'p1' })
  mockPrisma.usageLog.create.mockResolvedValue({})
}

// ---------- Tests ----------

describe('POST /api/export', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    setupDefaultMocks()
    const mod = await import('@/app/api/export/route')
    POST = mod.POST
  })

  it('projectIdなしで400', async () => {
    const res = await POST(makeRequest({}))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Project ID is required')
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await POST(makeRequest({ projectId: 'nonexistent' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Project not found')
  })

  it('他ユーザーのプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'other-user',
      videos: [],
    })

    const res = await POST(makeRequest({ projectId: 'p1' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Project not found')
  })

  it('動画ソースなしで400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
      videos: [],
      subtitles: [],
      style: null,
      aiSuggestions: [],
    })

    const res = await POST(makeRequest({ projectId: 'p1' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('No video source found')
  })

  it('プランアクセスエラーで403', async () => {
    mockValidateExportAccess.mockReturnValue('ウォーターマーク削除は有料プランで利用できます')

    const res = await POST(
      makeRequest({ projectId: 'p1', removeWatermark: true }),
    )
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.error).toContain('ウォーターマーク')
  })

  it('動画が長すぎると403', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
      compositionData: null,
      style: null,
      subtitles: [],
      aiSuggestions: [],
      videos: [
        {
          id: 'v1',
          storagePath: 'projects/p1/input.mp4',
          duration: 999,
          width: 1920,
          height: 1080,
          mimeType: 'video/mp4',
          silenceDetected: null,
        },
      ],
    })

    const res = await POST(makeRequest({ projectId: 'p1' }))
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.error).toContain('分を超える動画')
  })

  it('処理分数不足で402', async () => {
    mockGetBillingSnapshot.mockResolvedValue({
      plan: {
        id: 'free',
        maxSingleVideoMinutes: 10,
      },
      remainingSeconds: 10,
      usedSeconds: 5390,
    })
    mockCalculateExportChargeSeconds.mockReturnValue(60)

    const res = await POST(makeRequest({ projectId: 'p1' }))
    const json = await res.json()

    expect(res.status).toBe(402)
    expect(json.error).toContain('処理分数が不足')
  })

  it('エクスポート成功', async () => {
    const res = await POST(makeRequest({ projectId: 'p1' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.exportJob).toBeDefined()
    expect(json.downloadUrl).toBeDefined()
    expect(json.billing).toBeDefined()
  })

  it('認証なしで401', async () => {
    const url = new URL('/api/export', BASE)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ projectId: 'p1' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
