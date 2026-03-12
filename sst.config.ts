/* eslint-disable-next-line @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sakuedit",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "sakuedit",
        },
        stripe: {
          version: "0.0.28",
        },
      },
    };
  },
  async run() {
    const { createStripeResources } = await import("./infra/stripe");
    const isDevStage = $app.stage === "dev";

    const stripePublishableKey = new sst.Secret(
      "StripePublishableKey",
      "pk_test_replace_me",
    );
    const stripeSecretKey = new sst.Secret(
      "StripeSecretKey",
      "sk_test_replace_me",
    );
    const stripeWebhookSecret = new sst.Secret(
      "StripeWebhookSecret",
      "whsec_replace_me",
    );

    const stripeWebhookUrl = process.env.STRIPE_WEBHOOK_URL;
    const stripeProvider = new stripe.Provider("StripeProvider", {
      apiKey: stripeSecretKey.value,
    });
    const stripeResources = createStripeResources({
      provider: stripeProvider,
      webhookUrl: stripeWebhookUrl,
    });

    // ========================================
    // S3 Bucket for video storage
    // ========================================
    const videoBucket = new sst.aws.Bucket("VideoBucket", {
      // Not public - use presigned URLs for upload
      // Public read for serving processed videos
    });

    // ========================================
    // Video Processing Lambda (FFmpeg)
    // ========================================
    // NOTE: This Lambda uses FFmpeg for video processing.
    // For yt-dlp (YouTube download), you consider:
    // 1. Using a Lambda Layer with yt-dlp binary
    // 2. Container-based Lambda with yt-dlp installed
    // 3. External service API for YouTube downloads
    //
    // For simplicity, this setup focuses on FFmpeg processing.
    // YouTube downloads should be handled separately if needed.
    const videoProcessor = new sst.aws.Function("VideoProcessor", {
      handler: "infra/video-processor/handler.main",
      url: true, // Enable function URL for direct invocation
      timeout: "15 minutes", // Maximum Lambda timeout for video processing
      memory: "3008 MB", // Sufficient for video processing
      storage: "2048 MB", // Ephemeral storage for temporary files
      environment: {
        BUCKET_NAME: videoBucket.name,
      },
      link: [videoBucket],
      // Note: FFmpeg Layer is required for video processing
      // AWS provides FFmpeg Lambda Layers in various regions
      // See: https://docs.aws.amazon.com/lambda/latest/dg/lambda-images.html
      // Alternatively, use a custom layer with ffmpeg binary
    });

    // ========================================
    // Main Next.js Application
    // ========================================
    const web = new sst.aws.Nextjs("Web", {
      link: [
        videoBucket,
        videoProcessor,
        stripePublishableKey,
        stripeSecretKey,
        stripeWebhookSecret,
      ],
      environment: {
        // Video bucket name accessible via Resource.VideoBucket.name
        // Video processor URL accessible via Resource.VideoProcessor.url
        VIDEO_BUCKET_NAME: videoBucket.name,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey.value,
        STRIPE_PRO_PRICE_ID: stripeResources?.pro.monthlyPriceId ?? "",
        STRIPE_BUSINESS_PRICE_ID: stripeResources?.business.monthlyPriceId ?? "",
      },
    });

    if (isDevStage) {
      new sst.x.DevCommand("StripeCli", {
        link: [stripeSecretKey],
        environment: {
          STRIPE_API_KEY: stripeSecretKey.value,
          STRIPE_WEBHOOK_FORWARD_URL: "http://127.0.0.1:3000/api/stripe/webhook",
        },
        dev: {
          title: "Stripe CLI",
          autostart: true,
          command:
            "zsh -lc 'printf \"Stripe CLI ready\\nlisten: stripe listen --forward-to $STRIPE_WEBHOOK_FORWARD_URL\\ntrigger: stripe trigger checkout.session.completed\\n\"; exec zsh -i'",
        },
      });
    }

    // ========================================
    // Outputs
    // ========================================
    return {
      url: web.url,
      bucketName: videoBucket.name,
      videoProcessorUrl: videoProcessor.url,
      stripe: stripeResources
        ? {
            pro: stripeResources.pro,
            business: stripeResources.business,
            webhook: stripeResources.webhook
              ? {
                  endpointId: stripeResources.webhook.endpointId,
                  url: stripeResources.webhook.url,
                }
              : null,
          }
        : null,
    };
  },
});
