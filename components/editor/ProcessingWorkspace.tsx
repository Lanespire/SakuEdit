"use client";

import { useMemo } from "react";

interface ProcessingVideo {
  id: string;
  storagePath: string | null;
  previewUrl: string | null;
  filename: string;
  duration: number;
}

interface ProcessingLogEntry {
  id: string;
  timestamp: string;
  text: string;
}

interface ProcessingWorkspaceProps {
  projectName: string;
  status: string;
  progress: number;
  progressMessage: string;
  lastError?: string | null;
  video: ProcessingVideo | null;
  logs: ProcessingLogEntry[];
  onReload: () => void;
  onBackToProjects: () => void;
}

const processingSteps = [
  { label: "キュー投入", threshold: 0 },
  { label: "音声抽出", threshold: 1 },
  { label: "文字起こしと字幕生成", threshold: 20 },
  { label: "無音検出", threshold: 60 },
  { label: "Remotionレンダリング", threshold: 80 },
  { label: "サムネイルと波形保存", threshold: 90 },
] as const;

function getStepStatus(
  stepThreshold: number,
  progress: number,
  status: string,
) {
  if (status === "COMPLETED") {
    return "completed";
  }

  if (status === "ERROR") {
    return progress >= stepThreshold ? "completed" : "pending";
  }

  if (progress > stepThreshold) {
    return "completed";
  }

  if (progress === stepThreshold) {
    return "processing";
  }

  return "pending";
}

function getStatusIcon(status: "completed" | "processing" | "pending") {
  switch (status) {
    case "completed":
      return (
        <span className="material-symbols-outlined text-emerald-300">
          check_circle
        </span>
      );
    case "processing":
      return (
        <span className="material-symbols-outlined animate-spin text-primary">
          sync
        </span>
      );
    default:
      return (
        <span className="material-symbols-outlined text-white/30">circle</span>
      );
  }
}

function isRemotionRenderingInProgress(status: string, progress: number) {
  return status === "PROCESSING" && progress >= 80 && progress < 90;
}

export default function ProcessingWorkspace({
  projectName,
  status,
  progress,
  progressMessage,
  lastError,
  video,
  logs,
  onReload,
  onBackToProjects,
}: ProcessingWorkspaceProps) {
  const headerLabel = useMemo(() => {
    if (status === "ERROR") {
      return "処理エラー";
    }

    if (status === "COMPLETED") {
      return "処理完了";
    }

    return "動画を処理中";
  }, [status]);
  const showRemotionNotice = isRemotionRenderingInProgress(status, progress);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1a1411] font-display text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#4a3428] bg-[#1d1612] px-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToProjects}
            className="flex size-9 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/8 hover:text-white"
            title="プロジェクト一覧"
            data-test-id="processing-cancel-button"
          >
            <span className="material-symbols-outlined text-[18px]">
              folder_open
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-white/6 text-primary">
              <span className="material-symbols-outlined text-[18px]">
                movie_edit
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/88">
                {projectName || "プロジェクト"}
              </p>
              <p className="text-[11px] text-white/45">{headerLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            {Math.round(progress)}%
          </span>
          <button
            type="button"
            onClick={onReload}
            className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/80 transition-colors hover:bg-white/8 hover:text-white"
          >
            再取得
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3 xl:flex-row">
        <section
          className="flex min-h-[280px] flex-1 items-center justify-center rounded-[24px] border border-[#3f2d24] bg-[radial-gradient(circle_at_top,_rgba(249,116,21,0.08),_transparent_28%),linear-gradient(180deg,#26201d_0%,#171210_100%)] p-3 xl:p-4"
          data-test-id="processing-video-preview"
        >
          <div className="w-full max-w-[1040px]">
            <div className="overflow-hidden rounded-[22px] border border-[#403029] bg-[#181311] p-3 shadow-[0_20px_46px_rgba(0,0,0,0.28)]">
              {video?.previewUrl ? (
                <video
                  key={video.previewUrl}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  src={video.previewUrl}
                  className="aspect-video w-full rounded-[18px] border border-white/10 bg-[#0f0c0b]"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-[18px] border border-white/10 bg-gradient-to-br from-[#4a372c] to-[#241b16]">
                  <div className="text-center">
                    <span className="material-symbols-outlined mb-2 text-5xl text-white/25">
                      videocam_off
                    </span>
                    <p className="text-sm text-white/45">
                      動画が見つかりません
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-h-[280px] flex-col rounded-[24px] border border-[#3f2d24] bg-[#231a16] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:w-[360px] xl:min-w-[360px]">
          <div
            className="rounded-2xl border border-white/8 bg-[#18120f] p-4"
            data-test-id="processing-percentage-display"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="mt-2 text-xl font-black text-white">
                  {status === "ERROR"
                    ? "処理が停止しました"
                    : "動画を処理しています"}
                </h2>
              </div>
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold text-white/72">
                {status}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] ${
                  status === "ERROR"
                    ? "bg-red-400"
                    : "bg-gradient-to-r from-primary to-[#ffb57c]"
                }`}
                style={{ width: `${Math.max(4, Math.min(progress, 100))}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-white/72">
              {lastError || progressMessage || "処理状況を取得しています"}
            </p>
            {showRemotionNotice ? (
              <p className="mt-2 text-xs text-white/50">
                Remotionレンダリング中です。数分かかることがあり、最後の
                「circle」は次工程がまだ始まっていないだけです。
              </p>
            ) : null}
          </div>
          <div
            className="mt-5 flex-1 overflow-hidden rounded-2xl border border-white/8 bg-[#18120f] p-4"
            data-test-id="processing-steps"
          >
            <h3 className="mb-3 text-sm font-bold text-white/72">
              処理ステップ
            </h3>
            <div className="space-y-3 overflow-y-auto pr-1">
              {processingSteps.map((step) => {
                const stepStatus = getStepStatus(
                  step.threshold,
                  progress,
                  status,
                );

                return (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2"
                    data-test-id={`processing-step-${step.threshold}`}
                  >
                    {getStatusIcon(stepStatus)}
                    <span
                      className={
                        stepStatus === "pending"
                          ? "text-sm text-white/40"
                          : "text-sm text-white"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
