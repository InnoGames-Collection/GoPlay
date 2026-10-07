import React from 'react';
import { RotateCcw, Home, AlertCircle } from 'lucide-react';
import { BubbleSortAudio } from './audio';

interface BubbleSortGameOverModalProps {
  levelNumber: number;
  completedCategories: number;
  totalCategories: number;
  score: number;
  onRetry: () => void;
  onExitToLevelSelect: () => void;
}

export const BubbleSortGameOverModal: React.FC<BubbleSortGameOverModalProps> = ({
  levelNumber,
  completedCategories,
  totalCategories,
  score,
  onRetry,
  onExitToLevelSelect,
}) => {
  const handleRetry = () => {
    BubbleSortAudio.playTapSound();
    onRetry();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#1E2548] to-[#0D122B] border-2 border-rose-500/40 rounded-3xl shadow-[0_0_40px_rgba(244,63,94,0.3)] p-6 text-white text-center flex flex-col items-center">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black italic tracking-wide uppercase text-white drop-shadow mb-1">
          OUT OF MOVES
        </h2>
        <div className="text-xs text-rose-300 font-bold uppercase tracking-wider mb-4">
          Level {levelNumber} Failed
        </div>

        {/* Progress Box */}
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Categories Sorted</span>
            <span className="font-bold text-amber-300">
              {completedCategories} / {totalCategories}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Score Achieved</span>
            <span className="font-bold font-mono text-cyan-300">{score.toLocaleString()} PTS</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={handleRetry}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase shadow-[0_4px_16px_rgba(6,182,212,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2 border border-cyan-300/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={onExitToLevelSelect}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs tracking-wider uppercase border border-slate-700 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Level Select</span>
          </button>
        </div>
      </div>
    </div>
  );
};
