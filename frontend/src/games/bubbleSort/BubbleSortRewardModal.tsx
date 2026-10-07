import React from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { BubbleSortAudio } from './audio';

interface BubbleSortRewardModalProps {
  onClaim: () => void;
  onClose: () => void;
}

export const BubbleSortRewardModal: React.FC<BubbleSortRewardModalProps> = ({
  onClaim,
  onClose,
}) => {
  const handleClaim = () => {
    BubbleSortAudio.playPraiseSound();
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#2B3566] via-[#1E254A] to-[#121733] border-2 border-indigo-400/40 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.35)] p-6 text-white text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#18233C] hover:bg-[#25365C] border border-white/20 text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black italic tracking-wide uppercase text-white drop-shadow mb-6 mt-1">
          WELL DONE
        </h2>

        {/* Glowing Pink/Magenta Plus Icon */}
        <div className="relative w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#DB2777] via-[#EC4899] to-[#F472B6] shadow-[0_0_35px_rgba(236,72,153,0.7)] border-4 border-white mb-6 animate-pulse">
          <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
          <Plus className="w-14 h-14 text-white stroke-[4] drop-shadow" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" />
        </div>

        {/* Descriptions */}
        <div className="space-y-1 mb-6">
          <p className="text-sm font-bold text-slate-200">
            You have unlocked the <span className="text-[#F97316] font-black">EXTRA BUBBLES!</span>
          </p>
          <p className="text-xs text-slate-300/80">
            Tap it to spawn 3 new bubbles.
          </p>
        </div>

        {/* Claim Green Button */}
        <button
          onClick={handleClaim}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:brightness-110 active:scale-98 text-white font-black text-sm tracking-wider uppercase shadow-[0_4px_20px_rgba(34,197,94,0.5)] border-2 border-green-300/40 transition-all cursor-pointer"
        >
          CLAIM
        </button>
      </div>
    </div>
  );
};
