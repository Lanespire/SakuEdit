'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SERVICE_NAME } from '@/lib/constants';

type DemoState = 'processing' | 'complete';

const PROCESSING_STEPS = [
  { id: 'upload', label: '動画を読み込み' },
  { id: 'subtitle', label: '音声から字幕を生成' },
  { id: 'style', label: '参考スタイルを適用' },
  { id: 'silence', label: '無音区間をカット' },
  { id: 'render', label: '最終レンダリング' },
] as const;

export function ProcessingToEditorDemo() {
  const [state, setState] = useState<DemoState>('processing');
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

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
    setState('processing');
    setProgress(0);

    // Smooth progress animation (3 seconds total)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setState('complete'), 300);
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
    if (progress >= stepThresholds[index]) return 'done';
    if (progress >= stepThresholds[index] - 20) return 'active';
    return 'pending';
  };

  return (
    <div ref={containerRef} className="relative w-full min-h-[600px]">
      <AnimatePresence mode="wait">
        {state === 'processing' && (
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
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-foreground">{SERVICE_NAME}</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted hidden sm:block">プロジェクト名: 新しいVlog_01.mp4</span>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-primary font-medium">{progress}%</span>
                </motion.div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Left: Video Preview */}
              <div className="flex-[5.5] bg-black/5 p-6 flex items-center justify-center">
                <div className="relative w-full max-w-2xl aspect-video bg-black rounded-xl shadow-lg overflow-hidden">
                  {/* Video placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />

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
                      <span>00:{String(Math.floor(progress * 0.12)).padStart(2, '0')}</span>
                      <span>02:30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Processing Status */}
              <div className="flex-[4.5] bg-white p-6 border-l border-border">
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">処理ステータス</h3>

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
                            status === 'pending' ? 'opacity-40' : status === 'done' ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Status Icon */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              status === 'done'
                                ? 'bg-green-100 text-green-600'
                                : status === 'active'
                                ? 'bg-primary text-white ring-2 ring-primary/20 shadow-lg shadow-primary/30'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {status === 'done' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {status === 'active' && (
                              <motion.svg
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </motion.svg>
                            )}
                            {status === 'pending' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>

                          {/* Label */}
                          <div className="pt-0.5">
                            <p className={`text-sm ${status === 'active' ? 'font-bold text-foreground' : 'font-medium text-muted'}`}>
                              {step.label}
                              {status === 'active' && '...'}
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
                    <span className="text-sm font-medium text-foreground">全体の進捗</span>
                    <span className="text-lg font-bold text-primary">{progress}%</span>
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

        {state === 'complete' && (
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
              <span className="text-xs text-muted ml-2">{SERVICE_NAME} - 編集画面</span>
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
              <div className="flex bg-[#1a1a2e]">
                {/* Sidebar */}
                <div className="w-10 bg-[#16162a] border-r border-white/[0.06] py-3 flex-col items-center gap-2 shrink-0 hidden sm:flex">
                  {['🎬','📝','🎵','🎨'].map((icon, i) => (
                    <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${i === 0 ? 'bg-primary/20' : 'bg-white/[0.04]'}`}>
                      {icon}
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 min-w-0">
                  <div className="m-3 rounded-lg bg-[#0d0d1a] aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a3e] to-[#15152a]" />
                    <div className="absolute bottom-[14%] left-0 right-0 text-center px-4">
                      <span className="inline-block bg-black/60 text-white px-2.5 py-1 rounded text-xs font-medium">
                        今日はプログラミングの話をします
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 h-1 bg-white/20 rounded-full">
                      <div className="h-full w-full bg-primary rounded-full" />
                    </div>
                  </div>
                  <div className="px-3 pb-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-white/25 w-5 shrink-0">映像</span>
                      <div className="flex-1 h-4 flex gap-0.5">
                        <div className="h-full bg-primary/30 rounded-sm flex-[3]" />
                        <div className="h-full bg-primary/30 rounded-sm flex-[2]" />
                        <div className="h-full bg-primary/30 rounded-sm flex-[4]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-white/25 w-5 shrink-0">字幕</span>
                      <div className="flex-1 h-3 flex gap-0.5">
                        <div className="h-full bg-blue-400/25 rounded-sm flex-[2]" />
                        <div className="h-full bg-blue-400/25 rounded-sm flex-[1]" />
                        <div className="h-full bg-blue-400/25 rounded-sm flex-[3]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Animation */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.8 }}
                className="absolute inset-0 bg-success/10 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="bg-success text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  編集完了！
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
