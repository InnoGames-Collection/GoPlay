import React, { useState } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music } from 'lucide-react';
import { BubbleSortAudio } from './audio';

interface BubbleSortPauseModalProps {
  levelNumber: number;
  movesLeft: number;
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onExitToLevelSelect: () => void;
}

export const BubbleSortPauseModal: React.FC<BubbleSortPauseModalProps> = ({
  levelNumber,
  movesLeft,
  score,
  onResume,
  onRestart,
  onExitToLevelSelect,
}) => {
  const [soundMuted, setSoundMuted] = useState(BubbleSortAudio.getSoundMuted());
  const [musicMuted, setMusicMuted] = useState(BubbleSortAudio.getMusicMuted());

  const handleToggleSound = () => {
    const muted = BubbleSortAudio.toggleSound();
    setSoundMuted(muted);
    if (!muted) BubbleSortAudio.playTapSound();
  };

  const handleToggleMusic = () => {
    const muted = BubbleSortAudio.toggleMusic();
    setMusicMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#0C2D57] to-[#061830] border-2 border-cyan-400/40 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.4)] p-6 text-white text-center flex flex-col items-center">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        <h2 className="text-3xl font-black italic tracking-wide uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white drop-shadow mb-1">
          PAUSED
        </h2>
        <div className="text-xs text-cyan-200/80 font-bold uppercase tracking-wider mb-4">
          Level {levelNumber} • {movesLeft} Moves • {score} PTS
        </div>

        <div className="w-full space-y-2.5 mb-5">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-black text-sm tracking-wider uppercase shadow-[0_4px_16px_rgba(34,197,94,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2 border border-green-300/40"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-2xl bg-[#0e3b6f] hover:bg-[#124b8d] text-cyan-200 font-bold text-xs tracking-wider uppercase border border-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Restart Level</span>
          </button>

          {/* Exit */}
          <button
            onClick={onExitToLevelSelect}
            className="w-full py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs tracking-wider uppercase border border-slate-700/60 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Level Select</span>
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-cyan-900/60 w-full">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              soundMuted
                ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
            }`}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>SFX</span>
          </button>

          <button
            onClick={handleToggleMusic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              musicMuted
                ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                : 'bg-purple-500/20 border-purple-400/40 text-purple-300'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music</span>
          </button>
        </div>
      </div>
    </div>
  );
};
