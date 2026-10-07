import React from 'react';
import { ArrowLeft, Lock, Star, Trophy } from 'lucide-react';
import { BubbleSortProgress } from './types';
import { BUBBLE_SORT_LEVELS } from './levels';
import { BubbleSortAudio } from './audio';

interface BubbleSortLevelSelectProps {
  progress: BubbleSortProgress;
  onSelectLevel: (levelNum: number) => void;
  onBack: () => void;
}

export const BubbleSortLevelSelect: React.FC<BubbleSortLevelSelectProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  const handleLevelClick = (lvlNum: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      BubbleSortAudio.playErrorSound();
      return;
    }
    BubbleSortAudio.playTapSound();
    onSelectLevel(lvlNum);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-start items-center p-4 bg-gradient-to-b from-[#024089] via-[#04285E] to-[#021435] text-white select-none overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(125,211,252,0.6)_0%,transparent_70%)]" />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between gap-2 pb-3 pt-1 border-b border-cyan-400/20 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0a2754]/80 border border-cyan-400/30 text-xs font-black text-cyan-200 hover:text-white hover:border-cyan-300 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-black italic tracking-wide uppercase text-white drop-shadow">
          40 Tournament Levels
        </h2>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#072147]/90 border border-cyan-400/40 text-xs font-black text-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{progress.unlockedLevel}/40</span>
        </div>
      </div>

      {/* Level Grid (Scrollable) */}
      <div className="relative z-10 w-full max-w-md flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {BUBBLE_SORT_LEVELS.map((lvl) => {
            const isUnlocked = lvl.levelNumber <= progress.unlockedLevel;
            const isCurrent = lvl.levelNumber === progress.unlockedLevel;
            const record = progress.records[lvl.levelNumber];
            const stars = record?.stars || 0;

            return (
              <button
                key={lvl.levelNumber}
                onClick={() => handleLevelClick(lvl.levelNumber, isUnlocked)}
                disabled={!isUnlocked}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition-all ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-gradient-to-tr from-cyan-500 to-sky-400 border-2 border-white shadow-[0_0_15px_rgba(56,189,248,0.7)] text-slate-950 scale-102 cursor-pointer active:scale-95 animate-pulse'
                      : 'bg-[#093570] hover:bg-[#0c448f] border border-cyan-400/40 text-white shadow-md cursor-pointer active:scale-95'
                    : 'bg-[#061833]/80 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {/* Level Number or Lock Icon */}
                {isUnlocked ? (
                  <>
                    <span
                      className={`text-lg font-black font-sans ${
                        isCurrent ? 'text-slate-950' : 'text-white'
                      }`}
                    >
                      {lvl.levelNumber}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 ${
                            s <= stars
                              ? 'fill-amber-400 text-amber-400 drop-shadow'
                              : isCurrent
                              ? 'text-slate-700'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-slate-400/70" />
                    <span className="text-[10px] font-bold text-slate-500 mt-1">
                      {lvl.levelNumber}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
