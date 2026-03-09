'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';

type DemoState = 'idle' | 'processing' | 'complete';

// 処理ステップの設定
const PROCESSING_STEPS = [
  { id: 'silence', label: '無音部分を検出中', threshold: 20 },
  { id: 'filler', label: 'フィラーをカット中', threshold: 40 },
  { id: 'subtitle', label: '字幕を生成中', threshold: 60 },
  { id: 'style', label: 'スタイルを適用中', threshold: 80 },
  { id: 'optimize', label: '最適化中', threshold: 100 },
] as const;

export function DragDropDemo() {
  const [state, setState] = useState<DemoState>('idle');
  const [progress, setProgress] = useState(0);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // ビューポートに入ったら自動開始
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  // すべてのタイムアウトをクリア
  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  }, []);

  // デモ処理を開始
  const startProcessing = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    clearAllTimeouts();
    setState('processing');
    setProgress(0);

    // 各ステップのタイミングを設定
    const delays = [500, 1000, 1500, 2000, 2500];
    const progressValues = [20, 40, 60, 80, 100];

    progressValues.forEach((value, index) => {
      const timeoutId = setTimeout(() => setProgress(value), delays[index]);
      timeoutIdsRef.current.push(timeoutId);
    });

    // 完了状態へ
    const completeTimeout = setTimeout(() => setState('complete'), 3000);
    timeoutIdsRef.current.push(completeTimeout);

    // リセットしてループ
    const resetTimeout = setTimeout(() => {
      setState('idle');
      setProgress(0);
      hasStartedRef.current = false;
    }, 6000);
    timeoutIdsRef.current.push(resetTimeout);
  }, [clearAllTimeouts]);

  // ビューポートに入ったら自動開始
  const prevInViewRef = useRef(false);
  if (isInView && !prevInViewRef.current && state === 'idle' && !hasStartedRef.current) {
    startProcessing();
  }
  prevInViewRef.current = isInView;

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      {/* Drop Zone */}
      <motion.div
        animate={{
          scale: 1,
          borderColor: 'rgba(249, 116, 21, 0.3)',
        }}
        className="relative border-2 border-dashed border-primary/30 rounded-3xl bg-surface/50 backdrop-blur-sm overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #f97415 1px, transparent 1px),
                linear-gradient(to bottom, #f97415 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          {state === 'idle' && <IdleState key="idle" />}
          {state === 'processing' && <ProcessingState key="processing" progress={progress} />}
          {state === 'complete' && <CompleteState key="complete" />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ========================================
// Idle State Component
// ========================================
function IdleState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 relative z-10"
    >
      <FloatingIcon />
      <p className="text-xl font-medium text-foreground mb-2">動画をアップロード</p>
      <p className="text-muted text-center">スタイルを選んでAI編集</p>
      <FormatBadges />
    </motion.div>
  );
}

function FloatingIcon() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="mb-6"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center border border-primary/30">
        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
      </div>
    </motion.div>
  );
}

function FormatBadges() {
  return (
    <div className="flex gap-2 mt-6">
      {['MP4', 'MOV', 'AVI'].map((format) => (
        <span key={format} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
          {format}
        </span>
      ))}
    </div>
  );
}

// ========================================
// Processing State Component
// ========================================
function ProcessingState({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 relative z-10"
    >
      <ProgressRing progress={progress} />
      <p className="text-xl font-medium text-foreground mb-4">AIが編集中...</p>
      <ProcessingSteps progress={progress} />
    </motion.div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  return (
    <div className="relative w-24 h-24 mb-6">
      <motion.div className="absolute inset-0 rounded-2xl border-4 border-primary/20" />
      <motion.div
        className="absolute inset-0 rounded-2xl border-4 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{progress}%</span>
      </div>
    </div>
  );
}

function ProcessingSteps({ progress }: { progress: number }) {
  return (
    <div className="space-y-3 w-full max-w-xs">
      {PROCESSING_STEPS.map((step) => (
        <ProcessingStepItem
          key={step.id}
          label={step.label}
          progress={progress}
          threshold={step.threshold}
        />
      ))}
    </div>
  );
}

function ProcessingStepItem({
  label,
  progress,
  threshold,
}: {
  label: string;
  progress: number;
  threshold: number;
}) {
  const isComplete = progress >= threshold;
  const isActive = progress >= threshold - 20 && progress < threshold;

  return (
    <motion.div
      animate={{ opacity: isComplete ? 1 : isActive ? 0.7 : 0.3 }}
      className="flex items-center gap-3"
    >
      <StepIcon isComplete={isComplete} isActive={isActive} />
      <span
        className={`text-sm ${
          isComplete ? 'text-success' : isActive ? 'text-foreground' : 'text-muted'
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}

function StepIcon({ isComplete, isActive }: { isComplete: boolean; isActive: boolean }) {
  return (
    <motion.div
      animate={{ scale: isComplete ? 1 : isActive ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.3, repeat: isActive ? Infinity : 0 }}
      className={`w-5 h-5 rounded-full flex items-center justify-center ${
        isComplete ? 'bg-success' : isActive ? 'bg-primary' : 'bg-border'
      }`}
    >
      {isComplete && <CheckIcon />}
      {isActive && <SpinnerIcon />}
    </motion.div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
    />
  );
}

// ========================================
// Complete State Component
// ========================================
function CompleteState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 px-8 relative z-10"
    >
      <SuccessIcon />
      <p className="text-2xl font-bold text-foreground mb-2">編集完了！</p>
      <p className="text-muted text-center mb-6">
        10分の動画が <span className="text-success font-bold">7分</span> に短縮されました
      </p>
      <ResultButton />
    </motion.div>
  );
}

function SuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6"
    >
      <motion.svg
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-12 h-12 text-success"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </motion.svg>
    </motion.div>
  );
}

function ResultButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/30"
    >
      結果を確認 →
    </motion.button>
  );
}
