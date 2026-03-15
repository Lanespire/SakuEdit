import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Mocks ----------

const mockPrisma = {
  project: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }))

vi.mock('@/lib/billing', () => ({
  getBillingSnapshot: vi.fn().mockResolvedValue({
    plan: { id: 'free' },
    remainingSeconds: 5400,
    usedSeconds: 0,
  }),
}))

vi.mock('@/lib/server/processing-dispatch', () => ({
  dispatchProcessingJobOrMarkFailure: vi.fn(),
}))

vi.mock('@/lib/server/processing-jobs', () => ({
  recoverStaleProcessingJob: vi.fn().mockResolvedValue({ recovered: false }),
}))

// ---------- Helpers ----------

const BASE = 'http://localhost:3000'
const TEST_USER = 'test-user-api-projects'

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

// ---------- Tests ----------

describe('GET /api/projects', () => {
  let GET: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/route')
    GET = mod.GET as (req: NextRequest) => Promise<Response>
  })

  it('プロジェクト一覧を返す', async () => {
    const projects = [
      { id: 'p1', name: 'Project 1', userId: TEST_USER, status: 'DRAFT' },
    ]
    mockPrisma.project.findMany.mockResolvedValue(projects)

    const res = await GET(makeRequest('/api/projects'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.projects).toEqual(projects)
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER },
      }),
    )
  })

  it('statusパラメータでフィルタ', async () => {
    mockPrisma.project.findMany.mockResolvedValue([])

    const req = makeRequest('/api/projects')
    req.nextUrl.searchParams.set('status', 'COMPLETED')

    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER, status: 'COMPLETED' },
      }),
    )
  })

  it('無効なstatusは無視する', async () => {
    mockPrisma.project.findMany.mockResolvedValue([])

    const req = makeRequest('/api/projects')
    req.nextUrl.searchParams.set('status', 'INVALID_STATUS')

    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TEST_USER },
      }),
    )
  })

  it('testUserIdなしで401', async () => {
    const url = new URL('/api/projects', BASE)
    const req = new NextRequest(url)

    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/projects', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/route')
    POST = mod.POST as (req: NextRequest) => Promise<Response>
  })

  it('プロジェクトを作成する', async () => {
    const created = {
      id: 'new-p1',
      name: 'New Project',
      userId: TEST_USER,
      status: 'UPLOADING',
      styleId: null,
    }
    mockPrisma.project.create.mockResolvedValue(created)

    const res = await POST(
      makeRequest('/api/projects', {
        method: 'POST',
        body: { name: 'New Project' },
      }),
    )
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.project).toEqual(created)
    expect(mockPrisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: TEST_USER,
          name: 'New Project',
          status: 'UPLOADING',
        }),
      }),
    )
  })

  it('styleIdを指定して作成', async () => {
    mockPrisma.project.create.mockResolvedValue({ id: 'p2', styleId: 'style-1' })

    const res = await POST(
      makeRequest('/api/projects', {
        method: 'POST',
        body: { name: 'Styled Project', styleId: 'style-1' },
      }),
    )

    expect(res.status).toBe(201)
    expect(mockPrisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ styleId: 'style-1' }),
      }),
    )
  })

  it('名前なしで400', async () => {
    const res = await POST(
      makeRequest('/api/projects', {
        method: 'POST',
        body: {},
      }),
    )

    expect(res.status).toBe(400)
  })

  it('空文字の名前で400', async () => {
    const res = await POST(
      makeRequest('/api/projects', {
        method: 'POST',
        body: { name: '   ' },
      }),
    )

    expect(res.status).toBe(400)
  })

  it('不正なJSONボディで400', async () => {
    const url = new URL('/api/projects', BASE)
    url.searchParams.set('testUserId', TEST_USER)
    const req = new NextRequest(url, {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/projects/[id]', () => {
  let GET: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/[id]/route')
    GET = mod.GET as typeof GET
  })

  it('プロジェクト詳細を返す', async () => {
    const project = {
      id: 'p1',
      name: 'Test',
      userId: TEST_USER,
      status: 'DRAFT',
      videos: [],
      subtitles: [],
      style: null,
      aiSuggestions: [],
      timeline: null,
      markers: [],
      thumbnails: [],
    }
    // First call from getOwnedProject
    mockPrisma.project.findUnique
      .mockResolvedValueOnce({ id: 'p1', userId: TEST_USER })
      // Second call for full include
      .mockResolvedValueOnce(project)

    const res = await GET(makeRequest('/api/projects/p1'), {
      params: Promise.resolve({ id: 'p1' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.project).toEqual(project)
    expect(json.billing).toBeDefined()
    expect(json.billing.planId).toBe('free')
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await GET(makeRequest('/api/projects/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    expect(res.status).toBe(404)
  })

  it('他ユーザーのプロジェクトで403', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'other-user',
    })

    const res = await GET(makeRequest('/api/projects/p1'), {
      params: Promise.resolve({ id: 'p1' }),
    })

    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/projects/[id]', () => {
  let PATCH: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/[id]/route')
    PATCH = mod.PATCH as typeof PATCH
  })

  it('名前を更新する', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
      status: 'DRAFT',
    })
    mockPrisma.project.update.mockResolvedValue({
      id: 'p1',
      name: 'Updated Name',
    })

    const res = await PATCH(
      makeRequest('/api/projects/p1', {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.project.name).toBe('Updated Name')
    expect(mockPrisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      }),
    )
  })

  it('ステータスを更新する', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
      status: 'PROCESSING',
    })
    mockPrisma.project.update.mockResolvedValue({
      id: 'p1',
      status: 'COMPLETED',
    })

    const res = await PATCH(
      makeRequest('/api/projects/p1', {
        method: 'PATCH',
        body: { status: 'COMPLETED' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(200)
  })

  it('DRAFTへの巻き戻しは無視される', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
      status: 'PROCESSING',
    })
    mockPrisma.project.update.mockResolvedValue({ id: 'p1' })

    await PATCH(
      makeRequest('/api/projects/p1', {
        method: 'PATCH',
        body: { status: 'DRAFT' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    const updateCall = mockPrisma.project.update.mock.calls[0][0]
    expect(updateCall.data.status).toBeUndefined()
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await PATCH(
      makeRequest('/api/projects/nope', {
        method: 'PATCH',
        body: { name: 'X' },
      }),
      { params: Promise.resolve({ id: 'nope' }) },
    )

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/projects/[id]', () => {
  let DELETE: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/projects/[id]/route')
    DELETE = mod.DELETE as typeof DELETE
  })

  it('プロジェクトを削除する', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })
    mockPrisma.project.delete.mockResolvedValue({ id: 'p1' })

    const res = await DELETE(makeRequest('/api/projects/p1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'p1' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockPrisma.project.delete).toHaveBeenCalledWith({
      where: { id: 'p1' },
    })
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await DELETE(
      makeRequest('/api/projects/nope', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'nope' }) },
    )

    expect(res.status).toBe(404)
  })

  it('他ユーザーのプロジェクトで403', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'other-user',
    })

    const res = await DELETE(
      makeRequest('/api/projects/p1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(403)
  })
})
