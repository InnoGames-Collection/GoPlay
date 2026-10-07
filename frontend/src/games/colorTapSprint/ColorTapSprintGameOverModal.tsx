import React from 'react';
import { RotateCcw, Grid, Star } from 'lucide-react';
import { ColorTapSprintAudio } from './audio';

interface ColorTapSprintGameOverModalProps {
  score: number;
  bestScore: number;
  bestCombo: number;
  accuracy: number;
  onRestart: () => void;
  onLevelSelect: () => void;
}

export const ColorTapSprintGameOverModal: React.FC<ColorTapSprintGameOverModalProps> = ({
  score,
  bestScore,
  bestCombo,
  accuracy,
  onRestart,
  onLevelSelect,
}) => {
  const handleRestart = () => {
    ColorTapSprintAudio.playTapSound();
    onRestart();
  };

  const handleLevelSelect = () => {
    ColorTapSprintAudio.playTapSound();
    onLevelSelect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xs bg-[#FFFDF5] border-4 border-[#FBCFE8] rounded-3xl shadow-[0_12px_36px_rgba(236,72,153,0.35)] p-5 text-center flex flex-col items-center">
        {/* Ribbon Header: ★ GAME OVER ★ */}
        <div className="-mt-9 mb-4 px-6 py-2 rounded-2xl bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#F43F5E] border-2 border-white shadow-[0_4px_14px_rgba(244,63,94,0.5)] flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-[#FDE047] text-[#EAB308]" />
          <span className="text-base font-black italic tracking-wider uppercase text-white drop-shadow">
            GAME OVER
          </span>
          <Star className="w-4 h-4 fill-[#FDE047] text-[#EAB308]" />
        </div>

        {/* Stats Table (Exact from Reference Video at 00:30) */}
        <div className="w-full bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl p-4 mb-5 space-y-2.5 text-xs text-[#854D0E] font-extrabold uppercase tracking-wide">
          <div className="flex items-center justify-between">
            <span className="text-[#A16207]">FINAL SCORE:</span>
            <span className="font-mono text-base font-black text-[#1E293B]">{score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#A16207]">BEST SCORE:</span>
            <span className="font-mono text-base font-black text-[#1E293B]">{bestScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#A16207]">BEST COMBO:</span>
            <span className="font-mono text-base font-black text-[#1E293B]">{bestCombo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#A16207]">ACCURACY:</span>
            <span className="font-mono text-base font-black text-[#1E293B]">{accuracy}%</span>
          </div>
        </div>

        {/* RESTART Large Orange Button (Exact from Video) */}
        <button
          onClick={handleRestart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#C2410C] hover:brightness-110 active:scale-95 text-white font-black text-base tracking-wider uppercase shadow-[0_6px_20px_rgba(234,88,12,0.45)] border-2 border-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          <span>RESTART</span>
        </button>

        {/* Level Select */}
        <button
          onClick={handleLevelSelect}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-[#A16207] font-bold text-xs tracking-wider uppercase border border-amber-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Grid className="w-3.5 h-3.5 text-amber-500" />
          <span>Levels</span>
        </button>
      </div>
    </div>
  );
};
