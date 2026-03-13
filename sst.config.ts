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
          region: "ap-northeast-1",
        },
        stripe: {
          version: "0.0.28",
        },
      },
    };
  },
  async run() {
    const awsPulumi = await import("@pulumi/aws");
    const pulumi = await import("@pulumi/pulumi");
    const { createStripeResources } = await import("./infra/stripe");
    const { prepareVideoProcessingRuntime } = await import("./infra/video-runtime");
    const isDevStage = $app.stage === "dev";
    const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
    const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
    const databaseUrl = process.env.DATABASE_URL;
    const betterAuthUrl = process.env.BETTER_AUTH_URL;
    const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
    const processingWorkerToken = betterAuthSecret;
    const preparedRuntime = await prepareVideoProcessingRuntime();
    const configuredLayerArns = (process.env.VIDEO_PROCESSOR_LAYER_ARNS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const shouldCreateManagedLayer =
      !isDevStage && configuredLayerArns.length === 0 && preparedRuntime.canCreateDeployLayer;

    if (!tursoDatabaseUrl) {
      throw new Error("TURSO_DATABASE_URL is required");
    }

    if (!tursoAuthToken) {
      throw new Error("TURSO_AUTH_TOKEN is required");
    }

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required");
    }

    if (!betterAuthUrl) {
      throw new Error("BETTER_AUTH_URL is required");
    }

    if (!betterAuthSecret) {
      throw new Error("BETTER_AUTH_SECRET is required");
    }

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

    const managedVideoProcessorLayer = shouldCreateManagedLayer
      ? new awsPulumi.lambda.LayerVersion("VideoProcessorRuntimeLayer", {
          layerName: `sakuedit-${$app.stage}-video-runtime`,
          description: "ffmpeg/ffprobe/whisper/yt-dlp runtime for VideoProcessor",
          code: new pulumi.asset.FileArchive(preparedRuntime.runtimeRoot),
          compatibleArchitectures: [preparedRuntime.layerArchitecture],
          compatibleRuntimes: ["nodejs22.x"],
        })
      : null;
    const videoProcessorLayers = [
      ...configuredLayerArns,
      ...(managedVideoProcessorLayer ? [managedVideoProcessorLayer.arn] : []),
    ];
    const resolvedProcessingRuntimeRoot = isDevStage
      ? preparedRuntime.runtimeRoot
      : videoProcessorLayers.length > 0
        ? "/opt"
        : process.env.PROCESSING_RUNTIME_ROOT;
    const resolvedWhisperRoot = isDevStage
      ? preparedRuntime.whisperRoot
      : videoProcessorLayers.length > 0
        ? "/opt/whisper"
        : process.env.WHISPER_ROOT;
    const resolvedWhisperModel = process.env.WHISPER_MODEL ?? preparedRuntime.whisperModel;
    const resolvedWhisperModelPath = isDevStage
      ? preparedRuntime.whisperModelPath
      : videoProcessorLayers.length > 0
        ? `/opt/whisper/models/ggml-${resolvedWhisperModel}.bin`
        : process.env.WHISPER_MODEL_PATH;
    const resolvedWhisperCppVersion =
      process.env.WHISPER_CPP_VERSION ?? preparedRuntime.whisperCppVersion;
    const resolvedYtDlpPath = isDevStage
      ? preparedRuntime.ytDlpPath
      : videoProcessorLayers.length > 0
        ? "/opt/bin/yt-dlp"
        : process.env.YT_DLP_BIN;

    // ========================================
    // Video Processing Lambda (FFmpeg)
    // ========================================
    const videoProcessor = new sst.aws.Function("VideoProcessor", {
      handler: "infra/video-processor/handler.main",
      url: true, // Enable function URL for direct invocation
      timeout: "15 minutes", // Maximum Lambda timeout for video processing
      memory: "3008 MB", // Sufficient for video processing
      storage: "2048 MB", // Ephemeral storage for temporary files
      ...(videoProcessorLayers.length > 0 ? { layers: videoProcessorLayers } : {}),
      ...(managedVideoProcessorLayer
        ? { architecture: preparedRuntime.layerArchitecture }
        : {}),
      environment: {
        VIDEO_BUCKET_NAME: videoBucket.name,
        VIDEO_BUCKET_REGION: "ap-northeast-1",
        DATABASE_URL: databaseUrl,
        TURSO_DATABASE_URL: tursoDatabaseUrl,
        TURSO_AUTH_TOKEN: tursoAuthToken,
        BETTER_AUTH_URL: betterAuthUrl,
        BETTER_AUTH_SECRET: betterAuthSecret,
        PROCESSING_WORKER_TOKEN: processingWorkerToken,
        ...(resolvedProcessingRuntimeRoot
          ? {
              PROCESSING_RUNTIME_ROOT: resolvedProcessingRuntimeRoot,
            }
          : {}),
        ...(resolvedWhisperRoot
          ? {
              WHISPER_ROOT: resolvedWhisperRoot,
            }
          : {}),
        ...(resolvedWhisperModel
          ? {
              WHISPER_MODEL: resolvedWhisperModel,
            }
          : {}),
        ...(resolvedWhisperModelPath
          ? {
              WHISPER_MODEL_PATH: resolvedWhisperModelPath,
            }
          : {}),
        ...(resolvedWhisperCppVersion
          ? {
              WHISPER_CPP_VERSION: resolvedWhisperCppVersion,
            }
          : {}),
        ...(resolvedYtDlpPath
          ? {
              YT_DLP_BIN: resolvedYtDlpPath,
            }
          : {}),
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
        VIDEO_BUCKET_REGION: "ap-northeast-1",
        DATABASE_URL: databaseUrl,
        TURSO_DATABASE_URL: tursoDatabaseUrl,
        TURSO_AUTH_TOKEN: tursoAuthToken,
        BETTER_AUTH_URL: betterAuthUrl,
        BETTER_AUTH_SECRET: betterAuthSecret,
        PROCESSING_WORKER_TOKEN: processingWorkerToken,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey.value,
        STRIPE_PRO_PRICE_ID: stripeResources?.pro.monthlyPriceId,
        STRIPE_BUSINESS_PRICE_ID: stripeResources?.business.monthlyPriceId,
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
