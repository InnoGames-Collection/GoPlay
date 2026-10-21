/**
 * Emoji Fun — Top Bar & In-Game HUD Header
 * Lives and coin purchase mechanisms removed per spec.
 */

import React from 'react';
import { Settings, Lightbulb, X, ArrowLeft } from 'lucide-react';
import { emojiAudio } from '../emojiAudio';

interface EmojiFunHeaderProps {
  levelNumber?: number;
  hints?: number;
  showHints?: boolean;
  score?: number;
  onOpenSettings?: () => void;
  onUseHint?: () => void;
  onExit?: () => void;
  onBack?: () => void;
  // Deprecated props retained for signature compatibility
  coins?: number;
  lives?: number;
  showLives?: boolean;
  onOpenCoins?: () => void;
}

export const EmojiFunHeader: React.FC<EmojiFunHeaderProps> = ({
  levelNumber,
  hints = 5,
  showHints = false,
  score,
  onOpenSettings,
  onUseHint,
  onExit,
  onBack,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 z-30 select-none">
      {/* Left side: Back or Exit button */}
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            onClick={() => {
              emojiAudio.playTap();
              onBack();
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white active:scale-95 shadow-md flex items-center justify-center text-slate-700 transition-all border border-white/60 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : onExit ? (
          <button
            onClick={() => {
              emojiAudio.playTap();
              onExit();
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white active:scale-95 shadow-md flex items-center justify-center text-slate-700 transition-all border border-white/60 cursor-pointer"
            aria-label="Exit Game"
          >
            <X className="w-5 h-5" />
          </button>
        ) : null}

        {/* Brand / Game Title Badge */}
        <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/80">
          <span className="text-base leading-none">🎯</span>
          <span className="text-xs sm:text-sm font-black text-purple-900 tracking-wide font-['Fredoka',sans-serif]">
            {levelNumber ? `LEVEL ${levelNumber}` : 'EMOJI FUN'}
          </span>
        </div>
      </div>

      {/* Center: Active Score if playing */}
      {typeof score === 'number' && (
        <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full shadow-sm border border-white/70">
          <span className="text-[10px] font-black uppercase text-slate-500">Score</span>
          <span className="text-sm font-black text-amber-700 font-mono">{score}</span>
        </div>
      )}

      {/* Right side: Hint Button + Settings Gear */}
      <div className="flex items-center gap-2">
        {showHints && (
          <button
            onClick={() => {
              emojiAudio.playTap();
              onUseHint?.();
            }}
            className="flex items-center gap-1 bg-white/90 hover:bg-white active:scale-95 text-sky-600 font-bold px-3 py-1.5 rounded-2xl shadow-md border-2 border-[#81d4fa] transition-all cursor-pointer"
            title="Use Hint"
          >
            <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-xs sm:text-sm font-black text-slate-700">Hint</span>
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
              {hints}
            </span>
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={() => {
              emojiAudio.playTap();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white active:scale-95 shadow-md flex items-center justify-center text-slate-700 transition-all border border-white/60 cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        )}
      </div>
    </header>
  );
};
