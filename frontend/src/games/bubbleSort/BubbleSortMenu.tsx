import React, { useState } from 'react';
import { ArrowLeft, Play, Grid, HelpCircle, Volume2, VolumeX, Music, Award, Trophy, Settings } from 'lucide-react';
import { BubbleSortProgress } from './types';
import { BubbleSortAudio } from './audio';
import { GameLeaderboardModal, GameSettingsModal } from '../../components/gameMenu';

interface BubbleSortMenuProps {
  progress: BubbleSortProgress;
  onPlayCurrentLevel: () => void;
  onOpenLevelSelect: () => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

export const BubbleSortMenu: React.FC<BubbleSortMenuProps> = ({
  progress,
  onPlayCurrentLevel,
  onOpenLevelSelect,
  onExit,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleStart = () => {
    BubbleSortAudio.playTapSound();
    onPlayCurrentLevel();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-[#024089] via-[#04285E] to-[#021435] text-white select-none overflow-hidden">
      {/* Sunlight Beams from Ocean Surface */}
      <div className="absolute inset-0 pointer-events-none opacity-35 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(125,211,252,0.6)_0%,transparent_70%)]" />

      {/* Underwater Coral Reef Silhouette at bottom */}
      <div className="absolute -bottom-6 inset-x-0 h-40 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(3,105,161,0.8)_0%,transparent_80%)]" />

      {/* Decorative Floating Colorful Glossy Bubbles matching video splash screen */}
      <div className="absolute top-10 left-6 w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 via-fuchsia-600 to-indigo-900 border border-white/60 shadow-[0_0_25px_rgba(192,132,252,0.6)] animate-pulse pointer-events-none" />
      <div className="absolute top-16 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-green-300 via-emerald-500 to-teal-800 border border-white/60 shadow-[0_0_20px_rgba(52,211,153,0.6)] pointer-events-none" />
      <div className="absolute bottom-32 left-10 w-14 h-14 rounded-full bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800 border border-white/60 shadow-[0_0_20px_rgba(56,189,248,0.6)] pointer-events-none" />
      <div className="absolute bottom-28 right-8 w-18 h-18 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-red-700 border border-white/60 shadow-[0_0_25px_rgba(251,146,60,0.6)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between gap-2 pt-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a2754]/80 border border-cyan-400/30 text-xs font-black text-cyan-200 hover:text-white hover:border-cyan-300 active:scale-95 transition-all shadow-md cursor-pointer"
          title="Return to GoPlay Portal"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>GoPlay</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Wisdom / Level Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#072147]/90 border border-cyan-400/40 text-xs font-black text-amber-300 shadow">
            <span>Level {progress.unlockedLevel}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-full border text-xs transition-all active:scale-90 cursor-pointer ${
              soundMuted
                ? 'bg-slate-900/60 border-slate-700 text-slate-500'
                : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Music Toggle */}
          <button
            onClick={handleToggleMusic}
            className={`p-2 rounded-full border text-xs transition-all active:scale-90 cursor-pointer ${
              musicMuted
                ? 'bg-slate-900/60 border-slate-700 text-slate-500'
                : 'bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero / Brand Center */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center my-auto py-6 text-center">
        {/* Central 3D Bubble Sphere containing Logo as in Video at 00:02 */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center mb-6 shadow-[0_0_60px_rgba(249,115,22,0.45)] border-4 border-white/60 bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#FDBA74]">
          {/* Specular Highlight */}
          <div className="absolute top-3 left-6 w-20 h-10 rounded-full bg-white/65 blur-[1px] -rotate-30 pointer-events-none" />

          {/* 3D Bubble Sort Logo Typography */}
          <div className="relative flex flex-col items-center -rotate-2 select-none">
            <span className="text-4xl sm:text-5xl font-black italic tracking-tight text-white drop-shadow-[0_4px_8px_rgba(15,23,42,0.9)] stroke-blue-900">
              Bubble
            </span>
            <span className="text-3xl sm:text-4xl font-black italic tracking-widest text-[#FEF08A] drop-shadow-[0_4px_8px_rgba(120,53,15,0.9)] -mt-1">
              Sort
            </span>
          </div>
        </div>

        {/* Tournament Tagline */}
        <div className="text-xs sm:text-sm font-extrabold tracking-widest text-cyan-200 uppercase mb-6 drop-shadow">
          40 Tournament Word Sorting Levels
        </div>

        {/* Main CTA: PLAY NOW */}
        <button
          onClick={handleStart}
          className="group relative w-full max-w-xs py-4 px-8 rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] hover:brightness-110 active:scale-95 text-white font-black text-lg tracking-wider uppercase shadow-[0_6px_25px_rgba(34,197,94,0.6)] transition-all flex items-center justify-center gap-3 overflow-hidden border-2 border-green-300/40 cursor-pointer mb-3"
        >
          <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform drop-shadow" />
          <span className="drop-shadow-md">PLAY LEVEL {progress.unlockedLevel}</span>
        </button>

        {/* 4 Main Options Grid: Levels, Leaderboard, Settings, How to Play */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
          {/* 1. LEVELS */}
          <button
            onClick={() => {
              BubbleSortAudio.playTapSound();
              onOpenLevelSelect();
            }}
            className="py-2.5 px-3 rounded-xl bg-[#092b5e]/90 hover:bg-[#0c3778] active:scale-95 text-cyan-200 font-bold text-xs tracking-wider uppercase border border-cyan-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            <span>LEVELS</span>
          </button>

          {/* 2. LEADERBOARD */}
          <button
            onClick={() => {
              BubbleSortAudio.playTapSound();
              setShowLeaderboard(true);
            }}
            className="py-2.5 px-3 rounded-xl bg-[#092b5e]/90 hover:bg-[#0c3778] active:scale-95 text-amber-200 font-bold text-xs tracking-wider uppercase border border-amber-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>LEADERBOARD</span>
          </button>

          {/* 3. SETTINGS */}
          <button
            onClick={() => {
              BubbleSortAudio.playTapSound();
              setShowSettings(true);
            }}
            className="py-2.5 px-3 rounded-xl bg-[#092b5e]/90 hover:bg-[#0c3778] active:scale-95 text-cyan-200 font-bold text-xs tracking-wider uppercase border border-cyan-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Settings className="w-4 h-4 text-cyan-300" />
            <span>SETTINGS</span>
          </button>

          {/* 4. HOW TO PLAY */}
          <button
            onClick={() => {
              BubbleSortAudio.playTapSound();
              setShowHowToPlay(true);
            }}
            className="py-2.5 px-3 rounded-xl bg-[#092b5e]/90 hover:bg-[#0c3778] active:scale-95 text-purple-200 font-bold text-xs tracking-wider uppercase border border-purple-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <HelpCircle className="w-4 h-4 text-purple-300" />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* Bottom Progress Stats */}
      <div className="relative z-10 w-full max-w-md bg-[#071f45]/80 border border-cyan-400/20 rounded-2xl p-3 flex items-center justify-between text-xs text-cyan-200/80 mb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Unlocked: <strong className="text-white">{progress.unlockedLevel} / 40</strong></span>
        </div>
        <div>
          <span>Wisdom: <strong className="text-white">{progress.wisdom}</strong></span>
        </div>
      </div>

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <GameLeaderboardModal
          gameId="bubble-sort"
          gameTitle="Bubble Sort"
          userScore={progress.wisdom * 100 + progress.unlockedLevel * 250}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <GameSettingsModal
          gameTitle="Bubble Sort"
          soundEnabled={!soundMuted}
          musicEnabled={!musicMuted}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* How to play modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0C2D57] to-[#071933] border-2 border-cyan-400/40 rounded-3xl p-6 text-white text-left shadow-2xl">
            <h3 className="text-lg font-black uppercase text-cyan-300 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>How to Play Bubble Sort</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-200 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>1. Tap Related Word Bubbles:</strong> Tap two floating word bubbles that belong to the same category to merge them into a single bubble!
              </p>
              <p>
                <strong>2. Watch the Color Stages:</strong>
                <br />• 2 words merged = <span className="text-green-400 font-bold">Green Bubble</span>
                <br />• 3 words merged = <span className="text-purple-300 font-bold">Purple Bubble</span>
                <br />• 4 words merged = <span className="text-amber-400 font-bold">Orange Category Bubble</span>!
              </p>
              <p>
                <strong>3. Complete Categories:</strong> When all 4 related words merge, the bubble transforms into its Category Name (e.g. FRUITS, SHAPES, HOUSE) and bursts, filling the progress bar!
              </p>
              <p>
                <strong>4. Mind Your Moves:</strong> You have a limited move count per level. Avoid random taps that waste your moves!
              </p>
              <p>
                <strong>5. 40 Tournament Levels:</strong> Complete each level to sequentially unlock the next. Use the <span className="text-pink-400 font-bold">+ Extra Bubbles</span> booster on harder levels!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-5 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
