import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Resource } from "sst";

const s3 = new S3Client({});

interface ProcessVideoEvent {
  projectId: string;
  sourceUrl?: string;
  action: "extract-audio" | "transcribe" | "process" | "thumbnail";
  options?: {
    quality?: string;
    format?: string;
    silenceThreshold?: number;
    silenceDuration?: number;
  };
}

export async function main(event: ProcessVideoEvent) {
  const workDir = join(tmpdir(), "sakuedit", event.projectId);
  await mkdir(workDir, { recursive: true });

  console.log(`Processing video for project: ${event.projectId}`);
  console.log(`Action: ${event.action}`);
  console.log(`Work directory: ${workDir}`);

  try {
    switch (event.action) {
      case "extract-audio":
        return await extractAudio(event, workDir);
      case "process":
        return await processVideo(event, workDir);
      case "thumbnail":
        return await generateThumbnail(event, workDir);
      default:
        throw new Error(`Unknown action: ${event.action}`);
    }
  } finally {
    // Cleanup temp files
    try {
      const files = await readFile(workDir).catch(() => null);
      if (files) {
        await unlink(workDir).catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function extractAudio(event: ProcessVideoEvent, workDir: string) {
  const inputPath = join(workDir, "input.mp4");
  const audioPath = join(workDir, "audio.wav");

  // Download input video from S3
  const bucketName = Resource.VideoBucket.name;
  const inputKey = `projects/${event.projectId}/input.mp4`;

  console.log(`Downloading from S3: ${bucketName}/${inputKey}`);
  const inputObj = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: inputKey,
    })
  );
  await writeFile(inputPath, await inputObj.Body!.transformToByteArray());

  // Extract audio using ffmpeg
  console.log("Extracting audio with ffmpeg...");
  await runFFmpeg([
    "-i", inputPath,
    "-vn",
    "-acodec", "pcm_s16le",
    "-ar", "16000",
    "-ac", "1",
    "-y",
    audioPath,
  ]);

  // Upload audio to S3
  const audioKey = `projects/${event.projectId}/audio.wav`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: audioKey,
      Body: await readFile(audioPath),
      ContentType: "audio/wav",
    })
  );

  console.log(`Audio extracted and uploaded to: ${audioKey}`);
  return { success: true, audioKey };
}

async function processVideo(event: ProcessVideoEvent, workDir: string) {
  const inputPath = join(workDir, "input.mp4");
  const outputPath = join(workDir, "output.mp4");
  const srtPath = join(workDir, "subtitles.srt");

  const bucketName = Resource.VideoBucket.name;

  // Download input video
  const inputKey = `projects/${event.projectId}/input.mp4`;
  const inputObj = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: inputKey,
    })
  );
  await writeFile(inputPath, await inputObj.Body!.transformToByteArray());

  // Check if subtitles exist
  let hasSubtitles = false;
  try {
    const srtKey = `projects/${event.projectId}/subtitles.srt`;
    const srtObj = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: srtKey,
      })
    );
    await writeFile(srtPath, await srtObj.Body!.transformToByteArray());
    hasSubtitles = true;
  } catch {
    console.log("No subtitles found, skipping burn-in");
  }

  // Process video (silence detection + cutting would happen here)
  // For now, just copy and optionally burn subtitles
  const ffmpegArgs = ["-i", inputPath];

  if (hasSubtitles) {
    // Burn subtitles
    ffmpegArgs.push(
      "-vf",
      `subtitles=${srtPath}:force_style='FontName=Noto Sans JP,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'`
    );
  }

  ffmpegArgs.push(
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    outputPath
  );

  console.log("Processing video with ffmpeg...");
  await runFFmpeg(ffmpegArgs);

  // Upload output video
  const outputKey = `projects/${event.projectId}/output_${Date.now()}.mp4`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: outputKey,
      Body: await readFile(outputPath),
      ContentType: "video/mp4",
    })
  );

  console.log(`Video processed and uploaded to: ${outputKey}`);
  return { success: true, outputKey };
}

async function generateThumbnail(event: ProcessVideoEvent, workDir: string) {
  const inputPath = join(workDir, "input.mp4");
  const thumbnailPath = join(workDir, "thumbnail.jpg");

  const bucketName = Resource.VideoBucket.name;

  // Download input video (or use output if available)
  let inputKey = `projects/${event.projectId}/output.mp4`;
  try {
    await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: inputKey,
      })
    );
  } catch {
    inputKey = `projects/${event.projectId}/input.mp4`;
  }

  const inputObj = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: inputKey,
    })
  );
  await writeFile(inputPath, await inputObj.Body!.transformToByteArray());

  // Generate thumbnail
  console.log("Generating thumbnail...");
  await runFFmpeg([
    "-i", inputPath,
    "-ss", "00:00:01",
    "-vframes", "1",
    "-vf", "scale=1280:720",
    "-y",
    thumbnailPath,
  ]);

  // Upload thumbnail
  const thumbnailKey = `projects/${event.projectId}/thumbnail.jpg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: thumbnailKey,
      Body: await readFile(thumbnailPath),
      ContentType: "image/jpeg",
    })
  );

  console.log(`Thumbnail generated and uploaded to: ${thumbnailKey}`);
  return { success: true, thumbnailKey };
}

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log(`[ffmpeg] ${data.toString().trim()}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}
