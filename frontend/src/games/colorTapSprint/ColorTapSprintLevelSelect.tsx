import React from 'react';
import { ArrowLeft, Lock, Star, Trophy } from 'lucide-react';
import { ColorTapSprintProgress } from './types';
import { COLOR_TAP_SPRINT_LEVELS } from './levels';
import { ColorTapSprintAudio } from './audio';

interface ColorTapSprintLevelSelectProps {
  progress: ColorTapSprintProgress;
  onSelectLevel: (lvlNum: number) => void;
  onBack: () => void;
}

export const ColorTapSprintLevelSelect: React.FC<ColorTapSprintLevelSelectProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  const handleLevelClick = (lvlNum: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      ColorTapSprintAudio.playWrongSound();
      return;
    }
    ColorTapSprintAudio.playTapSound();
    onSelectLevel(lvlNum);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-start items-center p-4 bg-[#FFF8EE] text-[#1E293B] select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Decorative Candies in corners */}
      <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-pink-200/50 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-200/50 blur-xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pb-3 pt-1 border-b border-pink-200 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-pink-300 text-xs font-black text-pink-600 hover:bg-pink-50 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Back</span>
        </button>

        <h2 className="text-base font-black italic tracking-wide uppercase text-pink-600 drop-shadow-xs">
          40 Tournament Levels
        </h2>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs font-black text-amber-800 shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>{progress.unlockedLevel}/40</span>
        </div>
      </div>

      {/* Level Grid */}
      <div className="relative z-10 w-full max-w-md flex-1 overflow-y-auto pr-1 pb-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {COLOR_TAP_SPRINT_LEVELS.map((lvl) => {
            const isUnlocked = lvl.levelNumber <= progress.unlockedLevel;
            const isCurrent = lvl.levelNumber === progress.unlockedLevel;
            const rec = progress.records[lvl.levelNumber];
            const stars = rec?.stars ?? 0;

            return (
              <button
                key={lvl.levelNumber}
                onClick={() => handleLevelClick(lvl.levelNumber, isUnlocked)}
                disabled={!isUnlocked}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition-all ${
                  isUnlocked
                    ? isCurrent
                      ? 'bg-gradient-to-tr from-pink-400 via-rose-500 to-pink-500 border-2 border-white shadow-[0_0_15px_rgba(236,72,153,0.6)] text-white scale-102 cursor-pointer active:scale-95 animate-pulse'
                      : 'bg-white hover:bg-pink-50 border-2 border-pink-200 text-pink-950 shadow-xs cursor-pointer active:scale-95'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span
                      className={`text-base font-black font-sans ${
                        isCurrent ? 'text-white' : 'text-slate-800'
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
                              ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                              : isCurrent
                              ? 'text-pink-200'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 mt-1">
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
