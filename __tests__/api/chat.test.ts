import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Mocks ----------

const mockPrisma = {
  project: {
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }))

const mockGenerateOverlayOperations = vi.fn()
const mockGenerateCompositionPatches = vi.fn()

vi.mock('@/lib/ai-overlay-chat', () => ({
  generateOverlayOperations: mockGenerateOverlayOperations,
}))

vi.mock('@/lib/ai-composition-chat', () => ({
  generateCompositionPatches: mockGenerateCompositionPatches,
}))

// ---------- Helpers ----------

const BASE = 'http://localhost:3000'
const TEST_USER = 'test-user-api-chat'

/**
 * Chat route uses getRequiredUserId WITHOUT allowTestUserId,
 * so we need to also mock the auth module for session-based auth.
 * However, looking at the code again, getRequiredUserId is called
 * without options in chat route, so testUserId won't work.
 * We need to mock auth.api.getSession instead.
 */

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: TEST_USER },
      }),
    },
  },
}))

function makeRequest(
  path: string,
  options?: { method?: string; body?: unknown },
) {
  const url = new URL(path, BASE)

  const init: RequestInit = { method: options?.method ?? 'GET' }
  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  return new NextRequest(url, init)
}

type ChatRouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => Promise<Response>

// ---------- Tests ----------

describe('POST /api/projects/[id]/chat', () => {
  let POST: ChatRouteHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    // Restore default mock for auth
    const { auth } = await import('@/lib/auth')
    ;(auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: TEST_USER },
    })

    const mod = await import('@/app/api/projects/[id]/chat/route')
    POST = mod.POST as ChatRouteHandler
  })

  it('overlays形式でリクエスト', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    mockGenerateOverlayOperations.mockResolvedValue({
      operations: [{ type: 'add', overlay: { id: 'o1' } }],
      message: 'テキストを追加しました',
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: {
          message: 'テキストを追加して',
          overlays: [{ id: 'existing-1', type: 'text' }],
          fps: 30,
          aspectRatio: '16:9',
        },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.projectId).toBe('p1')
    expect(json.operations).toBeDefined()
    expect(mockGenerateOverlayOperations).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'テキストを追加して',
        fps: 30,
        aspectRatio: '16:9',
      }),
    )
  })

  it('compositionData形式でリクエスト（レガシー）', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    mockGenerateCompositionPatches.mockResolvedValue({
      patches: [{ op: 'replace', path: '/title', value: 'New Title' }],
      message: 'タイトルを変更しました',
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: {
          message: 'タイトルを変更して',
          compositionData: { title: 'Old Title' },
        },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.projectId).toBe('p1')
    expect(mockGenerateCompositionPatches).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'タイトルを変更して',
      }),
    )
  })

  it('データなしでも会話として処理される', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    mockGenerateOverlayOperations.mockResolvedValue({
      operations: [],
      message: 'はい、何かお手伝いしましょうか？',
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: { message: 'こんにちは' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.projectId).toBe('p1')
    expect(mockGenerateOverlayOperations).toHaveBeenCalledWith(
      expect.objectContaining({
        overlays: [],
        chatHistory: [],
      }),
    )
  })

  it('chatHistoryを渡す', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    mockGenerateOverlayOperations.mockResolvedValue({
      operations: [],
      message: 'OK',
    })

    const chatHistory = [
      { role: 'user' as const, content: '前の質問' },
      { role: 'assistant' as const, content: '前の回答' },
    ]

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: {
          message: '続き',
          overlays: [],
          chatHistory,
        },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockGenerateOverlayOperations).toHaveBeenCalledWith(
      expect.objectContaining({
        chatHistory,
      }),
    )
  })

  it('メッセージなしで400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: {},
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('空文字のメッセージで400', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: TEST_USER,
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: { message: '' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(400)
  })

  it('存在しないプロジェクトで404', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null)

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: { message: 'hello' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(404)
  })

  it('他ユーザーのプロジェクトで403', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'other-user',
    })

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: { message: 'hello' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(403)
  })

  it('認証なしで401', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await POST(
      makeRequest('/api/projects/p1/chat', {
        method: 'POST',
        body: { message: 'hello' },
      }),
      { params: Promise.resolve({ id: 'p1' }) },
    )

    expect(res.status).toBe(401)
  })
})
