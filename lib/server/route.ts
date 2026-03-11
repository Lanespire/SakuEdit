import { NextRequest, NextResponse } from 'next/server'
import { z, type ZodType } from 'zod'
import { zfd } from 'zod-form-data'
import { auth } from '@/lib/auth'

type ErrorPayload = {
  error: string
} & Record<string, unknown>

export class RouteError extends Error {
  status: number
  payload: ErrorPayload

  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.payload = {
      error: message,
      ...(extra ?? {}),
    }
  }
}

export function badRequest(message: string, extra?: Record<string, unknown>): never {
  throw new RouteError(400, message, extra)
}

export function unauthorized(message = 'Unauthorized'): never {
  throw new RouteError(401, message)
}

export function forbidden(message = 'Forbidden'): never {
  throw new RouteError(403, message)
}

export function notFound(message = 'Not found', extra?: Record<string, unknown>): never {
  throw new RouteError(404, message, extra)
}

export function paymentRequired(message: string): never {
  throw new RouteError(402, message)
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): never {
  throw new RouteError(status, message, extra)
}

export function assert(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) {
    throw new RouteError(status, message)
  }
}

export function ok<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init)
}

export function created<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, { status: 201, ...(init ?? {}) })
}

export function file(
  body: BodyInit,
  headers?: HeadersInit,
  init?: Omit<ResponseInit, 'headers'>,
) {
  return new NextResponse(body, {
    ...(init ?? {}),
    headers,
  })
}

export async function getSession(request: NextRequest) {
  return auth.api.getSession({
    headers: request.headers,
  })
}

export async function getRequiredUserId(
  request: NextRequest,
  options?: { allowTestUserId?: boolean },
) {
  if (options?.allowTestUserId && process.env.NODE_ENV === 'development') {
    const testUserId = request.nextUrl.searchParams.get('testUserId')
    if (testUserId) {
      return testUserId
    }
  }

  const session = await getSession(request)
  if (!session?.user?.id) {
    unauthorized()
  }

  return session.user.id
}

export async function parseJson<TSchema extends ZodType>(
  request: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    badRequest('Invalid JSON body')
  }

  const result = await schema.safeParseAsync(body)
  if (!result.success) {
    throw new RouteError(400, 'Invalid request body', {
      issues: result.error.flatten(),
    })
  }

  return result.data
}

export async function parseFormData<TSchema extends ZodType>(
  request: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    badRequest('Invalid form data')
  }

  const result = await zfd.formData(schema).safeParseAsync(formData)
  if (!result.success) {
    throw new RouteError(400, 'Invalid form data', {
      issues: result.error.flatten(),
    })
  }

  return result.data
}

export function handleRoute<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
  options?: { onError?: string },
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof RouteError) {
        return NextResponse.json(error.payload, { status: error.status })
      }

      console.error(options?.onError ?? 'Route handler error', error)
      return NextResponse.json(
        { error: options?.onError ?? 'Internal server error' },
        { status: 500 },
      )
    }
  }
}
