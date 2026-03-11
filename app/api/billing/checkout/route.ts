import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import { resolveUserPlan } from '@/lib/billing'
import { BILLABLE_PLAN_IDS, isPlanId, type PlanId } from '@/lib/plans'
import { getStripe, getStripePriceId } from '@/lib/stripe'

function isJsonRequest(request: NextRequest) {
  const accept = request.headers.get('accept') || ''
  const contentType = request.headers.get('content-type') || ''
  return accept.includes('application/json') || contentType.includes('application/json')
}

async function getRequestedPlanId(request: NextRequest): Promise<PlanId | null> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json()
    const planId = body.planId
    return typeof planId === 'string' && isPlanId(planId) ? planId : null
  }

  const formData = await request.formData()
  const planId = formData.get('planId')
  return typeof planId === 'string' && isPlanId(planId) ? planId : null
}

function buildSignInRedirect(request: NextRequest) {
  const signInUrl = new URL('/auth/signin', request.url)
  signInUrl.searchParams.set('callbackUrl', '/pricing')
  return signInUrl
}

// POST /api/billing/checkout - Create Stripe Checkout Session
export async function POST(request: NextRequest) {
  const wantsJson = isJsonRequest(request)

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      if (wantsJson) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return NextResponse.redirect(buildSignInRedirect(request), 303)
    }

    const planId = await getRequestedPlanId(request)
    if (!planId || !BILLABLE_PLAN_IDS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }
    const billablePlanId = planId as Extract<PlanId, 'pro' | 'business'>

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const currentBilling = await resolveUserPlan(user.id)
    if (
      currentBilling.plan.id === billablePlanId &&
      currentBilling.subscription.status &&
      currentBilling.subscription.status !== 'CANCELED'
    ) {
      return NextResponse.redirect(new URL('/pricing?billing=already-active', request.url), 303)
    }

    const stripe = getStripe()
    let stripeCustomerId = currentBilling.subscription.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    const origin = request.nextUrl.origin
    const priceId = getStripePriceId(billablePlanId)

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: `${origin}/pricing?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId: billablePlanId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: billablePlanId,
        },
      },
      line_items: [
        {
          quantity: 1,
          price: priceId,
        },
      ],
    })

    if (!checkoutSession.url) {
      throw new Error('Stripe checkout URL was not returned')
    }

    if (wantsJson) {
      return NextResponse.json({ url: checkoutSession.url })
    }

    return NextResponse.redirect(checkoutSession.url, 303)
  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
