import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Mocks ----------

const mockPrisma = {
  project: {
    findUnique: vi.fn(),
  },
  subtitle: {
    findMany: vi.fn(),
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

// ---------- Helpers ----------

const BASE = 'http://localhost:3000'
const TEST_USER = 'test-user-api-subtitles'

function makeRequest(
  path: string,
  options?: { method?: string; body?: unknown },
) {
  const url = new URL(path, BASE)
  url.searchParams.set('testUserId', TEST_USER)

  const init: RequestInit = { method: options?.method ?? 'GET' }
  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  return new NextRequest(url, init)
}

type SubtitleRouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => Promise<Response>

// ---------- Tests ----------

describe('GET /api/projects/[id]/subtitles', () => {
  let GET: SubtitleRouteHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/[id]/subtitles/route')
    GET = mod.GET as SubtitleRouteHandler
  })

  it('字幕一覧を返す', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const subtitles = [
      { id: 's1', projectId: 'p1', text: 'こんにちは', startTime: 0, endTime: 2 },
      { id: 's2', projectId: 'p1', text: 'ありがとう', startTime: 3, endTime: 5 },
    ]
    mockPrisma.subtitle.findMany.mockResolvedValue(subtitles)

    const res = await GET(makeRequest('/api/projects/p1/subtitles'), {
      params: Promise.resolve({ id: 'p1' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.subtitles).toEqual(subtitles)
    expect(mockPrisma.subtitle.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { startTime: 'asc' },
    })
  })

  it('空の字幕リストを返す', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })
    mockPrisma.subtitle.findMany.mockResolvedValue([])

    const res = await GET(makeRequest('/api/projects/p1/subtitles'), {
      params: Promise.resolve({ id: 'p1' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.subtitles).toEqual([])
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest('/api/projects/nope/subtitles'), {
      params: Promise.resolve({ id: 'nope' }),
    })

    expect(res.status).toBe(404)
  })

  it('他ユーザーのプロジェクトで403', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'other-user',
    })

    const res = await GET(makeRequest('/api/projects/p1/subtitles'), {
      params: Promise.resolve({ id: 'p1' }),
    })

    expect(res.status).toBe(403)
  })
})

describe('POST /api/projects/[id]/subtitles', () => {
  let POST: SubtitleRouteHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/[id]/subtitles/route')
    POST = mod.POST as SubtitleRouteHandler
  })

  const validSubtitle = {
    text: 'テスト字幕',
    startTime: 1.5,
    endTime: 3.5,
  }

  it('字幕を追加する', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const created = {
      id: 'sub-new',
      projectId: 'p1',
      ...validSubtitle,
      style: 'default',
      position: 'bottom',
      fontSize: 24,
      fontColor: '#FFFFFF',
      isBold: false,
    }
    mockPrisma.subtitle.create.mockResolvedValue(created)

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: validSubtitle,
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.subtitle).toEqual(created)
  })

  it('スタイル指定で字幕を追加', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })
    mockPrisma.subtitle.create.mockResolvedValue({ id: 'sub-styled' })

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: {
          ...validSubtitle,
          style: 'youtuber',
          fontSize: 36,
          fontColor: '#FF0000',
          isBold: true,
        },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(201)
    expect(mockPrisma.subtitle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          style: 'youtuber',
          fontSize: 36,
          fontColor: '#FF0000',
          isBold: true,
        }),
      }),
    )
  })

  it('テキストなしで400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: { startTime: 0, endTime: 1 },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('startTime未指定で400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: { text: 'test', endTime: 1 },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('無効なスタイルで400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: { ...validSubtitle, style: 'nonexistent' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('fontSizeが範囲外で400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/subtitles', {
        method: 'POST',
        body: { ...validSubtitle, fontSize: 999 },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await POST(
      makeRequest('/api/projects/nope/subtitles', {
        method: 'POST',
        body: validSubtitle,
      }),
      { params: Promise.resolve({ id: 'nope' }) },
    )

    expect(res.status).toBe(404)
  })
})
