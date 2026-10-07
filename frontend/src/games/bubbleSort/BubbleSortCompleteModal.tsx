import React, { useState, useEffect } from 'react';
import { Star, Clock, Gift, Plus } from 'lucide-react';
import { BubbleSortAudio } from './audio';

interface BubbleSortCompleteModalProps {
  levelNumber: number;
  timeSeconds: number;
  movesLeft: number;
  score: number;
  stars: number;
  wisdom: number;
  coins: number;
  onNextLevel: () => void;
}

export const BubbleSortCompleteModal: React.FC<BubbleSortCompleteModalProps> = ({
  levelNumber,
  timeSeconds,
  movesLeft,
  score,
  stars,
  wisdom,
  coins,
  onNextLevel,
}) => {
  const [phase, setPhase] = useState<'stars' | 'wisdom'>('stars');
  const [visibleStars, setVisibleStars] = useState(0);

  // Format time as mm:ss
  const mins = Math.floor(timeSeconds / 60);
  const secs = timeSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Animate stars in Phase 1
  useEffect(() => {
    BubbleSortAudio.playLevelCompleteSound();

    const t1 = setTimeout(() => {
      setVisibleStars(1);
      BubbleSortAudio.playStarSound(0);
    }, 400);

    const t2 = setTimeout(() => {
      if (stars >= 2) {
        setVisibleStars(2);
        BubbleSortAudio.playStarSound(1);
      }
    }, 850);

    const t3 = setTimeout(() => {
      if (stars >= 3) {
        setVisibleStars(3);
        BubbleSortAudio.playStarSound(2);
      }
    }, 1300);

    // Transition to Wisdom / Reward screen after stars
    const t4 = setTimeout(() => {
      setPhase('wisdom');
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [stars]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05162E]/90 backdrop-blur-md animate-in fade-in duration-300 select-none">
      {/* PHASE 1: STARS & LEVEL COMPLETE */}
      {phase === 'stars' && (
        <div className="flex flex-col items-center text-center animate-in zoom-in-90 duration-300">
          {/* 3 Stars */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map((starIdx) => {
              const isEarned = starIdx <= visibleStars;
              return (
                <div
                  key={starIdx}
                  className={`transform transition-all duration-300 ${
                    isEarned
                      ? 'scale-110 rotate-3 drop-shadow-[0_0_25px_rgba(250,204,21,0.9)]'
                      : 'scale-90 opacity-40 grayscale'
                  }`}
                >
                  <Star
                    className={`w-16 h-16 sm:w-20 sm:h-20 ${
                      isEarned ? 'fill-[#FACC15] text-[#EAB308]' : 'fill-slate-700 text-slate-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Level Complete Text */}
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-wide uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-3">
            LEVEL COMPLETE
          </h2>

          {/* Time Counter Pill */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/50 border border-white/20 text-white font-mono font-bold text-sm shadow-md">
            <Clock className="w-4 h-4 text-cyan-300" />
            <span>{timeFormatted}</span>
          </div>
        </div>
      )}

      {/* PHASE 2: WISDOM & NEXT LEVEL */}
      {phase === 'wisdom' && (
        <div className="relative w-full max-w-xs flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          {/* Top Coins Pill (Top-Left of Screen) */}
          <div className="absolute -top-16 left-0 flex items-center gap-2 px-3 py-1 rounded-full bg-[#18233C]/90 border border-white/15 text-white shadow-md">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-black text-xs">
              🪙
            </div>
            <span className="font-mono font-black text-sm">{coins}</span>
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </div>

          {/* Giant Glass Wisdom Bubble */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center mb-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] border-2 border-white/40 bg-gradient-to-b from-white/35 via-cyan-400/25 to-blue-600/40 backdrop-blur-sm">
            {/* Top-Left Specular Sheen */}
            <div className="absolute top-3 left-6 w-14 h-7 rounded-full bg-white/60 blur-[1px] -rotate-25 pointer-events-none" />

            <div className="text-4xl sm:text-5xl font-black font-sans text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {wisdom}
            </div>
            <div className="text-xs font-black tracking-widest uppercase text-cyan-100 drop-shadow mt-0.5">
              WISDOM
            </div>
          </div>

          {/* Gift Chest Progress Bar */}
          <div className="w-full flex items-center gap-2 px-4 mb-8">
            <div className="flex-1 h-3 rounded-full bg-black/60 border border-white/20 p-0.5 relative overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((wisdom % 9) / 9) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-mono font-bold text-white/80">
              {wisdom % 9}/9
            </div>
            <Gift className="w-5 h-5 text-amber-300 drop-shadow" />
          </div>

          {/* Next Level Green Button */}
          <button
            onClick={onNextLevel}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] hover:brightness-110 active:scale-98 text-white font-black text-lg tracking-wider shadow-[0_6px_24px_rgba(34,197,94,0.5)] border-2 border-green-300/40 transition-all cursor-pointer"
          >
            {levelNumber < 40 ? `LEVEL ${levelNumber + 1}` : 'FINISH TOURNAMENT'}
          </button>
        </div>
      )}
    </div>
  );
};
