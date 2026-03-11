import type { Output } from "@pulumi/pulumi";
import * as stripe from "pulumi-stripe";

export interface StripePlanResource {
  productId: Output<string>;
  monthlyPriceId: Output<string>;
}

export interface StripeWebhookResource {
  endpointId: Output<string>;
  url: Output<string>;
  secret: Output<string>;
}

export interface StripeResources {
  pro: StripePlanResource;
  business: StripePlanResource;
  webhook?: StripeWebhookResource;
}

export function createStripeResources(options: {
  provider: stripe.Provider;
  webhookUrl?: string;
}): StripeResources {
  const resourceOptions = { provider: options.provider };

  const proPlan = new stripe.Product("StripeProPlan", {
    name: "SakuEdit Pro",
    description: "継続的に動画制作する個人向けプラン",
    metadata: {
      planId: "pro",
      category: "subscription",
    },
  }, resourceOptions);

  const proMonthly = new stripe.Price("StripeProMonthly", {
    product: proPlan.id,
    currency: "jpy",
    unitAmount: 2480,
    nickname: "SakuEdit Pro 月額",
    recurring: {
      interval: "month",
      intervalCount: 1,
    },
    metadata: {
      planId: "pro",
      billingPeriod: "monthly",
    },
  }, resourceOptions);

  const businessPlan = new stripe.Product("StripeBusinessPlan", {
    name: "SakuEdit Business",
    description: "4K書き出しが必要な運用フェーズ向けプラン",
    metadata: {
      planId: "business",
      category: "subscription",
    },
  }, resourceOptions);

  const businessMonthly = new stripe.Price("StripeBusinessMonthly", {
    product: businessPlan.id,
    currency: "jpy",
    unitAmount: 8980,
    nickname: "SakuEdit Business 月額",
    recurring: {
      interval: "month",
      intervalCount: 1,
    },
    metadata: {
      planId: "business",
      billingPeriod: "monthly",
      quality4kMultiplier: "1.5",
    },
  }, resourceOptions);

  const webhookEndpoint = options.webhookUrl
    ? new stripe.WebhookEndpoint("StripeWebhook", {
        url: options.webhookUrl,
        enabledEvents: [
          "checkout.session.completed",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
        ],
      }, resourceOptions)
    : undefined;

  return {
    pro: {
      productId: proPlan.id,
      monthlyPriceId: proMonthly.id,
    },
    business: {
      productId: businessPlan.id,
      monthlyPriceId: businessMonthly.id,
    },
    webhook: webhookEndpoint
      ? {
          endpointId: webhookEndpoint.id,
          url: webhookEndpoint.url,
          secret: webhookEndpoint.secret,
        }
      : undefined,
  };
}
