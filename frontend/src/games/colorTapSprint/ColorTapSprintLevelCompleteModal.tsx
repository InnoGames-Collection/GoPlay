import React from 'react';
import { Play, Grid, Star } from 'lucide-react';
import { ColorTapSprintAudio } from './audio';

interface ColorTapSprintLevelCompleteModalProps {
  levelNumber: number;
  score: number;
  bestScore: number;
  bestCombo: number;
  accuracy: number;
  stars: number;
  onNextLevel: () => void;
  onLevelSelect: () => void;
}

export const ColorTapSprintLevelCompleteModal: React.FC<ColorTapSprintLevelCompleteModalProps> = ({
  levelNumber,
  score,
  bestScore,
  bestCombo,
  accuracy,
  stars,
  onNextLevel,
  onLevelSelect,
}) => {
  const isFinalLevel = levelNumber >= 40;

  const handleNext = () => {
    ColorTapSprintAudio.playTapSound();
    onNextLevel();
  };

  const handleLevelSelect = () => {
    ColorTapSprintAudio.playTapSound();
    onLevelSelect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-xs bg-[#FFFDF5] border-4 border-[#86EFAC] rounded-3xl shadow-[0_12px_36px_rgba(34,197,94,0.35)] p-5 text-center flex flex-col items-center">
        {/* Ribbon Header: ★ LEVEL COMPLETE ★ */}
        <div className="-mt-9 mb-4 px-6 py-2 rounded-2xl bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#16A34A] border-2 border-white shadow-[0_4px_14px_rgba(34,197,94,0.5)] flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-[#FDE047] text-[#EAB308]" />
          <span className="text-base font-black italic tracking-wider uppercase text-white drop-shadow">
            LEVEL {levelNumber} CLEAR
          </span>
          <Star className="w-4 h-4 fill-[#FDE047] text-[#EAB308]" />
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`transform transition-all duration-300 ${
                s <= stars ? 'scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'scale-90 opacity-30 grayscale'
              }`}
            >
              <Star
                className={`w-9 h-9 ${
                  s <= stars ? 'fill-[#FACC15] text-[#EAB308]' : 'fill-slate-300 text-slate-400'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats Table */}
        <div className="w-full bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-2xl p-4 mb-5 space-y-2 text-xs text-[#166534] font-extrabold uppercase tracking-wide">
          <div className="flex items-center justify-between">
            <span className="text-[#15803D]">LEVEL SCORE:</span>
            <span className="font-mono text-base font-black text-[#0F172A]">{score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#15803D]">BEST SCORE:</span>
            <span className="font-mono text-base font-black text-[#0F172A]">{bestScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#15803D]">MAX COMBO:</span>
            <span className="font-mono text-base font-black text-[#0F172A]">{bestCombo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#15803D]">ACCURACY:</span>
            <span className="font-mono text-base font-black text-[#0F172A]">{accuracy}%</span>
          </div>
        </div>

        {/* NEXT LEVEL Green Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] hover:brightness-110 active:scale-95 text-white font-black text-base tracking-wider uppercase shadow-[0_6px_20px_rgba(34,197,94,0.45)] border-2 border-green-200 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{isFinalLevel ? 'CHAMPION FINALE' : `LEVEL ${levelNumber + 1}`}</span>
        </button>

        {/* Level Select */}
        <button
          onClick={handleLevelSelect}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-[#166534] font-bold text-xs tracking-wider uppercase border border-green-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Grid className="w-3.5 h-3.5 text-green-600" />
          <span>Levels</span>
        </button>
      </div>
    </div>
  );
};
