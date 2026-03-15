import { NextRequest } from 'next/server'
import { SubscriptionStatus } from '@prisma/client'
import Stripe from 'stripe'
import prisma from '@/lib/db'
import { getPlanDefinitionByName, isPlanId, type PlanId } from '@/lib/plans'
import { badRequest, handleRoute, ok } from '@/lib/server/route'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe'

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIALING'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
    case 'unpaid':
      return 'CANCELED'
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'INCOMPLETE'
    case 'active':
    default:
      return 'ACTIVE'
  }
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  fallback: {
    userId?: string
    planId?: PlanId
    stripeCustomerId?: string | null
  } = {},
) {
  const planId = isPlanId(subscription.metadata.planId)
    ? subscription.metadata.planId
    : fallback.planId
  const userId = subscription.metadata.userId || fallback.userId

  if (!planId || !userId) {
    return
  }

  const plan = await prisma.plan.findUnique({
    where: { name: getPlanDefinitionByName(planId).id },
  })

  if (!plan) {
    return
  }

  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : fallback.stripeCustomerId || subscription.customer.id
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : new Date(subscription.billing_cycle_anchor * 1000)
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(subscription.billing_cycle_anchor * 1000)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: plan.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    },
    update: {
      planId: plan.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    },
  })
}

export const POST = handleRoute(async (request: NextRequest) => {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = getStripeWebhookSecret()

  if (!signature || !webhookSecret) {
    badRequest('Webhook secret is not configured')
  }

  const payload = await request.text()
  const stripe = getStripe()
  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionPlanId = isPlanId(session.metadata?.planId || '')
        ? (session.metadata?.planId as PlanId)
        : undefined

      if (session.mode === 'payment' && sessionPlanId === 'one-time') {
        // 買い切りプラン: 一括決済 → Subscription レコードを手動作成
        const userId = session.metadata?.userId
        const stripeCustomerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id

        if (userId) {
          const plan = await prisma.plan.findUnique({
            where: { name: 'one-time' },
          })

          if (plan) {
            const now = new Date()
            // 永久アクセス: far future (2099年) を設定
            const periodEnd = new Date('2099-12-31T23:59:59Z')

            await prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                planId: plan.id,
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                stripeCustomerId: stripeCustomerId || null,
                stripeSubscriptionId: null,
              },
              update: {
                planId: plan.id,
                status: 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: true,
                stripeCustomerId: stripeCustomerId || null,
                stripeSubscriptionId: null,
              },
            })
          }
        }
      } else if (session.mode === 'subscription' && typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        await syncSubscription(subscription, {
          userId: session.metadata?.userId,
          planId: sessionPlanId,
          stripeCustomerId:
            typeof session.customer === 'string' ? session.customer : session.customer?.id,
        })
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscription(subscription)
      break
    }
    default:
      break
  }

  return ok({ received: true })
}, { onError: 'Failed to process webhook' })
