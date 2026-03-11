import Stripe from 'stripe'
import { Resource } from 'sst'
import type { PlanId } from './plans'

let stripeClient: Stripe | null = null

function sanitizeSecretValue(value?: string) {
  if (!value) {
    return undefined
  }

  if (value.endsWith('replace_me')) {
    return undefined
  }

  return value
}

function readLinkedSecret(secretName: 'StripeSecretKey' | 'StripePublishableKey' | 'StripeWebhookSecret') {
  const linkedSecrets = Resource as unknown as Record<string, { value?: string } | undefined>
  return linkedSecrets[secretName]?.value
}

export function getStripeSecretKey() {
  return sanitizeSecretValue(process.env.STRIPE_SECRET_KEY) || sanitizeSecretValue(readLinkedSecret('StripeSecretKey'))
}

export function getStripePublishableKey() {
  return (
    sanitizeSecretValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
    sanitizeSecretValue(process.env.STRIPE_PUBLISHABLE_KEY) ||
    sanitizeSecretValue(readLinkedSecret('StripePublishableKey'))
  )
}

export function getStripeWebhookSecret() {
  return sanitizeSecretValue(process.env.STRIPE_WEBHOOK_SECRET) || sanitizeSecretValue(readLinkedSecret('StripeWebhookSecret'))
}

export function getStripe() {
  const apiKey = getStripeSecretKey()

  if (!apiKey) {
    throw new Error('Stripe secret key is not configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2026-02-25.clover',
    })
  }

  return stripeClient
}

const PLAN_PRICE_ENV_KEYS: Record<Extract<PlanId, 'pro' | 'business'>, string> = {
  pro: 'STRIPE_PRO_PRICE_ID',
  business: 'STRIPE_BUSINESS_PRICE_ID',
}

export function getStripePriceId(planId: Extract<PlanId, 'pro' | 'business'>) {
  const priceId = process.env[PLAN_PRICE_ENV_KEYS[planId]]

  if (!priceId) {
    throw new Error(`Stripe price ID is not configured for plan: ${planId}`)
  }

  return priceId
}
