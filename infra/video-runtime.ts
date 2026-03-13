import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  type WhisperModel,
} from "@remotion/install-whisper-cpp";

const require = createRequire(import.meta.url);
const ffmpegStatic = require("ffmpeg-static") as string | null;
const ffprobeStatic = require("ffprobe-static") as { path?: string };

const DEFAULT_WHISPER_MODEL: WhisperModel = "base";
const DEFAULT_WHISPER_CPP_VERSION = "1.7.4";

function isBuildBinLayout(version: string) {
  const [major = 0, minor = 0, patch = 0] = version
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  if (major > 1) return true;
  if (major < 1) return false;
  if (minor > 7) return true;
  if (minor < 7) return false;
  return patch >= 4;
}

function resolveExistingPath(candidates: Array<string | null | undefined>) {
  return candidates
    .filter((candidate): candidate is string => Boolean(candidate))
    .find((candidate) => existsSync(candidate));
}

function resolveFromPath(command: string) {
  return resolveExistingPath(
    (process.env.PATH || "")
      .split(path.delimiter)
      .filter(Boolean)
      .map((entry) => path.join(entry, command)),
  );
}

function resolveLocalBinary(command: "ffmpeg" | "ffprobe" | "yt-dlp") {
  if (command === "ffmpeg") {
    return resolveExistingPath([
      process.env.FFMPEG_BIN,
      ffmpegStatic,
      "/opt/homebrew/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      resolveFromPath("ffmpeg"),
    ]);
  }

  if (command === "ffprobe") {
    return resolveExistingPath([
      process.env.FFPROBE_BIN_PATH,
      ffprobeStatic.path,
      "/opt/homebrew/bin/ffprobe",
      "/usr/local/bin/ffprobe",
      resolveFromPath("ffprobe"),
    ]);
  }

  return resolveExistingPath([
    process.env.YT_DLP_BIN,
    "/opt/homebrew/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    resolveFromPath("yt-dlp"),
  ]);
}

async function ensureCopiedFile(sourcePath: string, destinationPath: string) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });

  let shouldCopy = true;
  try {
    const [sourceStat, destinationStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(destinationPath),
    ]);
    shouldCopy =
      sourceStat.size !== destinationStat.size ||
      sourceStat.mtimeMs !== destinationStat.mtimeMs;
  } catch {
    shouldCopy = true;
  }

  if (shouldCopy) {
    await fs.copyFile(sourcePath, destinationPath);
  }

  await fs.chmod(destinationPath, 0o755);
}

async function ensureWhisperRuntime(input: {
  runtimeRoot: string;
  whisperModel: WhisperModel;
  whisperCppVersion: string;
}) {
  const whisperRoot = path.join(input.runtimeRoot, "whisper");
  const whisperExecutablePath = isBuildBinLayout(input.whisperCppVersion)
    ? path.join(whisperRoot, "build", "bin", "whisper-cli")
    : path.join(whisperRoot, "main");
  const whisperModelDir = path.join(whisperRoot, "models");
  const whisperModelPath = path.join(
    whisperModelDir,
    `ggml-${input.whisperModel}.bin`,
  );

  if (!existsSync(whisperExecutablePath)) {
    await installWhisperCpp({
      version: input.whisperCppVersion,
      to: whisperRoot,
      printOutput: false,
    });
  }

  await fs.mkdir(whisperModelDir, { recursive: true });
  if (!existsSync(whisperModelPath)) {
    await downloadWhisperModel({
      model: input.whisperModel,
      folder: whisperModelDir,
      printOutput: false,
    });
  }

  return {
    whisperRoot,
    whisperModelPath,
  };
}

export async function prepareVideoProcessingRuntime() {
  const whisperModel =
    (process.env.WHISPER_MODEL as WhisperModel | undefined) ||
    DEFAULT_WHISPER_MODEL;
  const whisperCppVersion =
    process.env.WHISPER_CPP_VERSION || DEFAULT_WHISPER_CPP_VERSION;
  const runtimeRoot = path.join(
    process.cwd(),
    ".sst",
    "runtime",
    "video-processing",
    `${process.platform}-${process.arch}-${whisperCppVersion}-${whisperModel}`,
  );

  const ffmpegPath = resolveLocalBinary("ffmpeg");
  if (!ffmpegPath) {
    throw new Error("Local ffmpeg binary is required to prepare the video runtime.");
  }

  const ffprobePath = resolveLocalBinary("ffprobe");
  if (!ffprobePath) {
    throw new Error("Local ffprobe binary is required to prepare the video runtime.");
  }

  const ytDlpPath = resolveLocalBinary("yt-dlp");

  await ensureCopiedFile(ffmpegPath, path.join(runtimeRoot, "bin", "ffmpeg"));
  await ensureCopiedFile(ffprobePath, path.join(runtimeRoot, "bin", "ffprobe"));
  if (ytDlpPath) {
    await ensureCopiedFile(ytDlpPath, path.join(runtimeRoot, "bin", "yt-dlp"));
  }

  const whisper = await ensureWhisperRuntime({
    runtimeRoot,
    whisperModel,
    whisperCppVersion,
  });

  return {
    runtimeRoot,
    whisperRoot: whisper.whisperRoot,
    whisperModelPath: whisper.whisperModelPath,
    whisperModel,
    whisperCppVersion,
    ytDlpPath: ytDlpPath ? path.join(runtimeRoot, "bin", "yt-dlp") : undefined,
    layerArchitecture: process.arch === "arm64" ? "arm64" : "x86_64",
    canCreateDeployLayer: process.platform === "linux",
  } as const;
}
