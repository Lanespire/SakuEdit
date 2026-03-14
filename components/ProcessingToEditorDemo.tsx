"use client";

import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { SERVICE_NAME } from "@/lib/constants";

const WAVE = [30,58,42,78,52,68,35,88,55,72,40,82,50,62,45,76,32,70,55,85,42,75,58,48,80,45,68,38,78,62,52,72,44,88,50,65,78,48,70,38,55,82,60,72,42,52,78,65,45,70];

type DemoState = "processing" | "complete";

const PROCESSING_STEPS = [
  { id: "upload", label: "動画を読み込み" },
  { id: "subtitle", label: "音声から字幕を生成" },
  { id: "style", label: "参考スタイルを適用" },
  { id: "silence", label: "無音区間をカット" },
  { id: "render", label: "最終レンダリング" },
] as const;

export function ProcessingToEditorDemo() {
  const [state, setState] = useState<DemoState>("processing");
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startDemo = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    clearAllTimers();
    setState("processing");
    setProgress(0);

    // Smooth progress animation (3 seconds total)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setState("complete"), 300);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
  }, [clearAllTimers]);

  useEffect(() => {
    if (isInView && !hasStartedRef.current) {
      startDemo();
    }
  }, [isInView, startDemo]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Calculate which step is active based on progress
  const getStepStatus = (index: number) => {
    const stepThresholds = [15, 35, 55, 75, 100];
    if (progress >= stepThresholds[index]) return "done";
    if (progress >= stepThresholds[index] - 20) return "active";
    return "pending";
  };

  return (
    <div ref={containerRef} className="relative w-full min-h-[600px]">
      <AnimatePresence mode="wait">
        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-border">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="SakuEdit" width={32} height={32} />
                <span className="font-bold text-foreground">
                  {SERVICE_NAME}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted hidden sm:block">
                  プロジェクト名: 新しいVlog_01.mp4
                </span>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-primary font-medium">
                    {progress}%
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Left: Video Preview */}
              <div className="flex-[5.5] bg-black/5 p-6 flex items-center justify-center">
                <div className="relative w-full max-w-2xl aspect-video bg-black rounded-xl shadow-lg overflow-hidden">
                  {/* Video preview with man.png */}
                  <Image
                    src="/man.png"
                    alt="動画プレビュー"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    プレビュー (処理中)
                  </div>

                  {/* Simulated Subtitle */}
                  <div className="absolute bottom-16 left-0 right-0 text-center px-8">
                    <span className="inline-block bg-white/90 text-black px-4 py-2 text-lg font-bold rounded-lg">
                      今日はプログラミングについて...
                    </span>
                  </div>

                  {/* Video Progress Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <div className="w-full h-1.5 bg-white/30 rounded-full mb-3">
                      <motion.div
                        className="h-full bg-primary rounded-full relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between text-white/90 text-xs font-mono">
                      <span>
                        00:
                        {String(Math.floor(progress * 0.12)).padStart(2, "0")}
                      </span>
                      <span>02:30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Processing Status */}
              <div className="flex-[4.5] bg-white p-6 border-l border-border">
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">
                    処理ステータス
                  </h3>

                  <div className="space-y-3">
                    {PROCESSING_STEPS.map((step, index) => {
                      const status = getStepStatus(index);
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-start gap-3 ${
                            status === "pending"
                              ? "opacity-40"
                              : status === "done"
                                ? "opacity-50"
                                : ""
                          }`}
                        >
                          {/* Status Icon */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              status === "done"
                                ? "bg-green-100 text-green-600"
                                : status === "active"
                                  ? "bg-primary text-white ring-2 ring-primary/20 shadow-lg shadow-primary/30"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {status === "done" && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {status === "active" && (
                              <motion.svg
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </motion.svg>
                            )}
                            {status === "pending" && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Label */}
                          <div className="pt-0.5">
                            <p
                              className={`text-sm ${status === "active" ? "font-bold text-foreground" : "font-medium text-muted"}`}
                            >
                              {step.label}
                              {status === "active" && "..."}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      全体の進捗
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state === "complete" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-xs text-muted ml-2">
                {SERVICE_NAME} - 編集画面
              </span>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-auto flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-success">完了</span>
              </motion.div>
            </div>

            {/* Editor Screen Mockup (CSS) */}

            <div className="relative">
              <div
                className="rounded-2xl border border-gray-200 shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden"
                role="img"
                aria-label="SakuEdit エディタのプレビュー画面"
              >
                {/* Window Chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1e2e] border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c940]/80" />
                  </div>
                  <span className="text-[11px] text-white/40 ml-2 font-mono">
                    {SERVICE_NAME} — 新しいVlog_01.mp4
                  </span>
                </div>

                {/* Editor Body */}
                <div className="flex bg-[#1a1a2e]">
                  {/* Sidebar */}
                  <div className="w-11 bg-[#16162a] border-r border-white/[0.06] py-3 flex-col items-center gap-2.5 shrink-0 hidden sm:flex">
                    {[
                      {
                        active: true,
                        d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
                      },
                      {
                        active: false,
                        d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
                      },
                      {
                        active: false,
                        d: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
                      },
                      {
                        active: false,
                        d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${item.active ? "bg-primary/20 ring-1 ring-primary/30" : "bg-white/[0.04]"}`}
                      >
                        <svg
                          className={`w-3.5 h-3.5 ${item.active ? "text-primary" : "text-white/30"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d={item.d}
                          />
                        </svg>
                      </div>
                    ))}
                  </div>

                  {/* Main Area */}
                  <div className="flex-1 min-w-0">
                    <div className="m-3 sm:m-4 rounded-lg overflow-hidden bg-[#0d0d1a] aspect-video relative">
                      <Image
                        src="/man.png"
                        alt="動画編集プレビュー"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 60vw"
                      />
                      {/* Auto-generated subtitle highlight */}
                      <div className="absolute bottom-[14%] left-0 right-0 text-center px-4">
                        <span className="inline-block bg-white/90 text-[#1a1a2e] px-3 py-1 rounded text-xs sm:text-sm font-bold shadow-sm">
                          今日はプログラミングの話をします
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <div className="w-full h-1 bg-white/20 rounded-full">
                          <div className="h-full w-[42%] bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                    {/* Timeline with auto-cut indicators */}
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] text-white/30 font-mono">
                          01:23
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[9px] text-white/30 font-mono">
                          03:45
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/25 w-6 shrink-0">
                          映像
                        </span>
                        <div className="flex-1 h-5 flex gap-0.5">
                          <div className="h-full bg-primary/30 rounded-sm flex-[3]" />
                          <div className="h-full bg-red-400/20 rounded-sm flex-[0.5] border border-red-400/30 border-dashed" />
                          <div className="h-full bg-primary/30 rounded-sm flex-[2]" />
                          <div className="h-full bg-red-400/20 rounded-sm flex-[0.4] border border-red-400/30 border-dashed" />
                          <div className="h-full bg-primary/30 rounded-sm flex-[4]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/25 w-6 shrink-0">
                          字幕
                        </span>
                        <div className="flex-1 h-4 flex gap-1">
                          <div className="h-full bg-blue-400/25 rounded-sm flex-[2]" />
                          <div className="h-full bg-blue-400/25 rounded-sm flex-[1]" />
                          <div className="h-full bg-blue-400/25 rounded-sm flex-[3]" />
                          <div className="h-full bg-blue-400/25 rounded-sm flex-[1.5]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/25 w-6 shrink-0">
                          音声
                        </span>
                        <div className="flex-1 h-4 bg-green-500/[0.08] rounded-sm flex items-end px-px gap-px">
                          {WAVE.map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-green-400/30 rounded-t-sm"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Panel */}
                  <div className="w-40 bg-[#16162a] border-l border-white/[0.06] p-3 hidden lg:block shrink-0">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">
                      プロパティ
                    </p>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[9px] text-white/25 mb-1">
                          フォント
                        </p>
                        <div className="h-6 bg-white/[0.04] rounded border border-white/[0.08] px-2 flex items-center">
                          <span className="text-[10px] text-white/50">
                            Noto Sans JP
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/25 mb-1">サイズ</p>
                        <div className="h-6 bg-white/[0.04] rounded border border-white/[0.08] px-2 flex items-center">
                          <span className="text-[10px] text-white/50">
                            24px
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/25 mb-1">色</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-white rounded-sm border border-white/20" />
                          <span className="text-[10px] text-white/50">
                            #FFFFFF
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annotation callouts (desktop only) */}
              <div className="hidden md:block">
                <div className="absolute -right-2 top-[38%] translate-x-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-px bg-primary/40" />
                    <span className="text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded">
                      自動生成された字幕
                    </span>
                  </div>
                </div>
                <div className="absolute -right-2 top-[72%] translate-x-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-px bg-red-400/40" />
                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
                      無音区間を自動検出
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
