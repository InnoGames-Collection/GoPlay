import React, { useState } from 'react';
import { ArrowLeft, Play, Grid, HelpCircle, Volume2, VolumeX, Music, Trophy, Settings } from 'lucide-react';
import { ColorTapSprintProgress } from './types';
import { ColorTapSprintAudio } from './audio';
import { GameLeaderboardModal, GameSettingsModal } from '../../components/gameMenu';

interface ColorTapSprintMenuProps {
  progress: ColorTapSprintProgress;
  onPlayLevel: () => void;
  onOpenLevelSelect: () => void;
  onExit: () => void;
  isAudioEnabled?: boolean;
}

export const ColorTapSprintMenu: React.FC<ColorTapSprintMenuProps> = ({
  progress,
  onPlayLevel,
  onOpenLevelSelect,
  onExit,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundMuted, setSoundMuted] = useState(ColorTapSprintAudio.getSoundMuted());
  const [musicMuted, setMusicMuted] = useState(ColorTapSprintAudio.getMusicMuted());

  const handleToggleSound = () => {
    const muted = ColorTapSprintAudio.toggleSound();
    setSoundMuted(muted);
    if (!muted) ColorTapSprintAudio.playTapSound();
  };

  const handleToggleMusic = () => {
    const muted = ColorTapSprintAudio.toggleMusic();
    setMusicMuted(muted);
  };

  const handleStart = () => {
    ColorTapSprintAudio.playTapSound();
    onPlayLevel();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 bg-[#FFF9F0] text-[#1E293B] select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Decorative Candy Frosting Drops (Top & Bottom) */}
      <div className="absolute top-0 inset-x-0 h-10 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.6)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.6)_0%,transparent_70%)]" />

      {/* Decorative Candies in corners matching video splash */}
      {/* Swirl Lollipop Top Right */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-yellow-200 border-4 border-white shadow-md pointer-events-none opacity-70 rotate-45" />
      {/* Lime Slice Bottom Left */}
      <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-gradient-to-tr from-lime-400 via-emerald-300 to-white border-4 border-white shadow-md pointer-events-none opacity-75 -rotate-12" />
      {/* Pink Swirl Candy Bottom Right */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-400 to-white border-4 border-white shadow-lg pointer-events-none opacity-80" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-1">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-pink-200 text-xs font-black text-pink-600 hover:bg-pink-50 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>GoPlay</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Audio Toggles */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-full border text-xs transition-all active:scale-90 cursor-pointer ${
              soundMuted
                ? 'bg-slate-100 border-slate-200 text-slate-400'
                : 'bg-pink-100 border-pink-300 text-pink-600 shadow-xs'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleMusic}
            className={`p-2 rounded-full border text-xs transition-all active:scale-90 cursor-pointer ${
              musicMuted
                ? 'bg-slate-100 border-slate-200 text-slate-400'
                : 'bg-amber-100 border-amber-300 text-amber-600 shadow-xs'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero / Logo Branding Section (Exact from video 00:01 - 00:03) */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center my-auto py-4 text-center">
        {/* Floating Colorful Candy Box with Logo */}
        <div className="relative mb-5 flex flex-col items-center select-none">
          {/* Decorative Candies */}
          <div className="absolute -top-3 -left-4 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-white shadow-sm" />
          <div className="absolute -top-2 -right-3 w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-300 border-2 border-white shadow-sm" />
          <div className="absolute -bottom-2 -left-3 w-6 h-6 rounded-md bg-gradient-to-tr from-lime-400 to-green-300 border-2 border-white shadow-sm rotate-12" />

          {/* 3D Glossy "Color Tap Sprint" Title Typography */}
          <div className="flex flex-col items-center leading-none">
            <span className="text-4xl sm:text-5xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] via-[#F59E0B] to-[#3B82F6] drop-shadow-[0_4px_6px_rgba(236,72,153,0.3)]">
              Color Tap
            </span>
            <span className="text-4xl sm:text-5xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#EC4899] drop-shadow-[0_4px_6px_rgba(239,68,68,0.3)] mt-1">
              Sprint
            </span>
          </div>

          <div className="mt-3 px-4 py-1 rounded-full bg-pink-100 border border-pink-300 text-xs font-black text-pink-700 tracking-wide">
            Train your color reflex
          </div>
        </div>

        {/* Level Indicator Pill */}
        <div className="mb-6 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border-2 border-amber-300 text-xs font-black text-amber-800 shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Level {progress.unlockedLevel} / 40</span>
        </div>

        {/* Big Start Button (Exact Pink Pill from Video 00:04) */}
        <button
          onClick={handleStart}
          className="group relative w-full max-w-xs py-4 px-8 rounded-full bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#F43F5E] hover:brightness-110 active:scale-95 text-white font-black text-lg tracking-wider uppercase shadow-[0_8px_25px_rgba(236,72,153,0.5)] transition-all flex items-center justify-center gap-3 border-2 border-white cursor-pointer mb-3"
        >
          <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
          <span>START LEVEL {progress.unlockedLevel}</span>
        </button>

        {/* 4 Main Options Grid: Levels, Leaderboard, Settings, How to Play */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
          {/* 1. LEVELS */}
          <button
            onClick={() => {
              ColorTapSprintAudio.playTapSound();
              onOpenLevelSelect();
            }}
            className="py-2.5 px-3 rounded-2xl bg-white hover:bg-pink-50 active:scale-95 text-pink-700 font-bold text-xs tracking-wider uppercase border-2 border-pink-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Grid className="w-4 h-4 text-pink-500" />
            <span>LEVELS</span>
          </button>

          {/* 2. LEADERBOARD */}
          <button
            onClick={() => {
              ColorTapSprintAudio.playTapSound();
              setShowLeaderboard(true);
            }}
            className="py-2.5 px-3 rounded-2xl bg-white hover:bg-pink-50 active:scale-95 text-amber-700 font-bold text-xs tracking-wider uppercase border-2 border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>LEADERBOARD</span>
          </button>

          {/* 3. SETTINGS */}
          <button
            onClick={() => {
              ColorTapSprintAudio.playTapSound();
              setShowSettings(true);
            }}
            className="py-2.5 px-3 rounded-2xl bg-white hover:bg-pink-50 active:scale-95 text-sky-700 font-bold text-xs tracking-wider uppercase border-2 border-sky-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Settings className="w-4 h-4 text-sky-500" />
            <span>SETTINGS</span>
          </button>

          {/* 4. HOW TO PLAY */}
          <button
            onClick={() => {
              ColorTapSprintAudio.playTapSound();
              setShowHowToPlay(true);
            }}
            className="py-2.5 px-3 rounded-2xl bg-white hover:bg-pink-50 active:scale-95 text-purple-700 font-bold text-xs tracking-wider uppercase border-2 border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* Best Score Stat Footer */}
      <div className="relative z-10 w-full max-w-md bg-white/80 border border-pink-200 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-600 mb-1 shadow-xs">
        <div>
          <span>Tournament Best: <strong className="text-pink-600">{progress.bestScore} PTS</strong></span>
        </div>
        <div>
          <span>Focus Boosters: <strong className="text-emerald-600">{progress.focusCount}x</strong></span>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <GameLeaderboardModal
          gameId="color-tap-sprint"
          gameTitle="Color Tap Sprint"
          userScore={progress.bestScore}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <GameSettingsModal
          gameTitle="Color Tap Sprint"
          soundEnabled={!soundMuted}
          musicEnabled={!musicMuted}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* How to play modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FFFDF5] border-4 border-pink-300 rounded-3xl p-6 text-left shadow-2xl">
            <h3 className="text-lg font-black uppercase text-pink-600 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              <span>How to Play Color Tap Sprint</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>1. Read the Instruction:</strong> Look at the top prompt: <span className="text-pink-600 font-black">"TAP THE CARD COLOR"</span> and check the target color (e.g. <strong>BLUE</strong>).
              </p>
              <p>
                <strong>2. The Card Color is Key:</strong> You must tap the card whose <em>BACKGROUND COLOR</em> matches the target.
              </p>
              <p>
                <strong>3. Watch Out for Stroop Decoys:</strong> On higher levels, the words written on the cards will deliberately trick you! (e.g. a Red card that says "BLUE"). Ignore the written text and focus purely on the <strong>CARD COLOR</strong>!
              </p>
              <p>
                <strong>4. Time & Combo:</strong> Correct taps give <span className="text-emerald-600 font-bold">+1.3s</span> and build combos. Wrong taps deduct <span className="text-rose-600 font-bold">-4s</span> and break your combo!
              </p>
              <p>
                <strong>5. Focus Booster:</strong> Tap the green <span className="text-emerald-600 font-bold">FOCUS x1</span> button when stuck to reveal the exact card and slow down time!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-5 w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Let's Sprint!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
