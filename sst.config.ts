/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sakuedit",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
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
      link: [videoBucket, videoProcessor],
      environment: {
        // Video bucket name accessible via Resource.VideoBucket.name
        // Video processor URL accessible via Resource.VideoProcessor.url
      },
    });

    // ========================================
    // Outputs
    // ========================================
    return {
    url: web.url,
    bucketName: videoBucket.name,
    videoProcessorUrl: videoProcessor.url,
    };
  },
});
